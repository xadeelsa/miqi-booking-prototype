import { PrismaClient, type SchoolLevel } from "@prisma/client";

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

// A couple of example bookings so a fresh clone has something to look at:
// /admin is populated immediately, and these slots visibly disappear from the
// available list — the anti-double-booking guarantee demonstrating itself.
const exampleBookings: {
  reference: string;
  serviceSlug: string;
  slotIndex: number;
  schoolLevel: SchoolLevel;
  year: string;
  subject: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  studentName: string;
}[] = [
  {
    reference: "MIQI-7QK4P",
    serviceSlug: "bijles-1op1",
    slotIndex: 0,
    schoolLevel: "VWO",
    year: "Klas 4",
    subject: "Wiskunde",
    parentName: "Anne de Vries",
    parentEmail: "anne.devries@example.nl",
    parentPhone: "+31 6 1234 5678",
    studentName: "Sem de Vries",
  },
  {
    reference: "MIQI-3XB9M",
    serviceSlug: "huiswerkbegeleiding",
    slotIndex: 3,
    schoolLevel: "HAVO",
    year: "Klas 2",
    subject: "Engels",
    parentName: "Youssef Bakker",
    parentEmail: "y.bakker@example.nl",
    parentPhone: "+31 6 8765 4321",
    studentName: "Lina Bakker",
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

  // Example bookings (idempotent on `reference`).
  const upcoming = await db.slot.findMany({
    orderBy: { startsAt: "asc" },
    take: 10,
  });

  let created = 0;
  for (const example of exampleBookings) {
    const slot = upcoming[example.slotIndex];
    const service = await db.service.findUnique({
      where: { slug: example.serviceSlug },
    });
    if (!slot || !service) continue;

    // Skip if this slot is already taken by a different booking.
    const slotTaken = await db.booking.findUnique({
      where: { slotId: slot.id },
    });
    if (slotTaken && slotTaken.reference !== example.reference) continue;

    await db.booking.upsert({
      where: { reference: example.reference },
      update: {},
      create: {
        reference: example.reference,
        slotId: slot.id,
        serviceId: service.id,
        schoolLevel: example.schoolLevel,
        year: example.year,
        subject: example.subject,
        parentName: example.parentName,
        parentEmail: example.parentEmail,
        parentPhone: example.parentPhone,
        studentName: example.studentName,
        priceCents: service.priceCents,
        paymentStatus: "PAID",
      },
    });
    created++;
  }

  console.log(
    `Seeded ${services.length} services, ${slots.length} slots and ${created} example bookings.`,
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
