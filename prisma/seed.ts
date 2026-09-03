import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Fictitious tutoring services (prices in cents).
// Service names stay in Dutch — they are the client's real product names.
const services = [
  {
    slug: "bijles-1op1",
    name: "Bijles 1-op-1",
    description: "Personal one-to-one tutoring, tailored to your child.",
    priceCents: 4500,
  },
  {
    slug: "huiswerkbegeleiding",
    name: "Huiswerkbegeleiding",
    description: "Guidance with planning and completing homework.",
    priceCents: 2500,
  },
  {
    slug: "examentraining",
    name: "Examentraining",
    description: "Focused preparation for school and final exams.",
    priceCents: 6000,
  },
];

// Generate a fixed set of static availability slots: the next ~15 weekdays,
// afternoons at 14:00–18:00 UTC (≈ after-school in the Netherlands), 60 min each.
function generateSlots(): { startsAt: Date; endsAt: Date }[] {
  const slots: { startsAt: Date; endsAt: Date }[] = [];
  const startHoursUtc = [14, 15, 16, 17, 18];

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  day.setUTCDate(day.getUTCDate() + 1); // start tomorrow

  let weekdaysAdded = 0;
  while (weekdaysAdded < 15) {
    const dow = day.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      for (const h of startHoursUtc) {
        const startsAt = new Date(day);
        startsAt.setUTCHours(h, 0, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setUTCMinutes(endsAt.getUTCMinutes() + 60);
        slots.push({ startsAt, endsAt });
      }
      weekdaysAdded++;
    }
    day.setUTCDate(day.getUTCDate() + 1);
  }
  return slots;
}

async function main() {
  // Idempotent: upsert on the unique keys so the seed can be re-run safely.
  for (const service of services) {
    await db.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  const slots = generateSlots();
  for (const slot of slots) {
    await db.slot.upsert({
      where: { startsAt: slot.startsAt },
      update: {},
      create: slot,
    });
  }

  console.log(
    `Seeded ${services.length} services and ${slots.length} slots.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
