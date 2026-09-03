import { db } from "@/lib/db";
import type { BookingInput } from "@/lib/validation";

/**
 * Tests run against a real Postgres, which on a developer's machine is very
 * likely the same database they have been clicking through by hand. So
 * fixtures are confined to a window the seed never touches — availability
 * beyond 2098 — and cleared *before* each test rather than after, so a run
 * that crashes half way through can't poison the next one.
 */

export const FIXTURE_EPOCH = new Date("2098-01-01T00:00:00Z");
export const FIXTURE_SERVICE_SLUG = "fixture-only-service";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function resetFixtures(): Promise<void> {
  await db.booking.deleteMany({
    where: {
      OR: [
        { service: { slug: FIXTURE_SERVICE_SLUG } },
        { slot: { startsAt: { gte: FIXTURE_EPOCH } } },
      ],
    },
  });
  await db.slot.deleteMany({ where: { startsAt: { gte: FIXTURE_EPOCH } } });
  await db.service.deleteMany({ where: { slug: FIXTURE_SERVICE_SLUG } });
}

/**
 * Active, because `loadBookingContext` only resolves active services — and
 * removed again by `resetFixtures`, so it never shows up in the real funnel.
 */
export function createFixtureService() {
  return db.service.create({
    data: {
      slug: FIXTURE_SERVICE_SLUG,
      name: "Fixture session",
      description: "Created by the test suite.",
      priceCents: 4500,
      active: true,
    },
  });
}

export function createFixtureSlot(offsetHours = 0) {
  const startsAt = new Date(FIXTURE_EPOCH.getTime() + offsetHours * ONE_HOUR_MS);
  return db.slot.create({
    data: { startsAt, endsAt: new Date(startsAt.getTime() + ONE_HOUR_MS) },
  });
}

export function bookingInputFor(
  serviceSlug: string,
  slotId: number,
): BookingInput {
  return {
    service: serviceSlug,
    level: "VWO",
    year: "Klas 4",
    subject: "Wiskunde",
    slot: slotId,
    parentName: "Anne de Vries",
    parentEmail: "anne.devries@example.nl",
    parentPhone: "+31 6 1234 5678",
    studentName: "Sem de Vries",
  };
}
