import { db } from "@/lib/db";
import type { BookingInput } from "@/lib/validation";

/**
 * The test database is usually the one the developer has been clicking through,
 * so fixtures stay in windows the seed never touches: slots beyond 2098,
 * history before 2000, and a reserved service-slug prefix. Cleared *before*
 * each test, so a run that crashes half way through can't poison the next one.
 */

export const FIXTURE_EPOCH = new Date("2098-01-01T00:00:00Z");

/** For slots that must already have started. */
export const FIXTURE_PAST_EPOCH = new Date("1990-01-01T00:00:00Z");
const FIXTURE_PAST_LIMIT = new Date("2000-01-01T00:00:00Z");

const SLUG_PREFIX = "fixture-only-";
export const FIXTURE_SERVICE_SLUG = `${SLUG_PREFIX}service`;
export const FIXTURE_INACTIVE_SERVICE_SLUG = `${SLUG_PREFIX}inactive`;

const ONE_HOUR_MS = 60 * 60 * 1000;

/** Both fixture windows, as a reusable slot filter. */
const FIXTURE_SLOTS = {
  OR: [
    { startsAt: { gte: FIXTURE_EPOCH } },
    { startsAt: { lt: FIXTURE_PAST_LIMIT } },
  ],
};

export async function resetFixtures(): Promise<void> {
  await db.booking.deleteMany({
    where: {
      OR: [{ service: { slug: { startsWith: SLUG_PREFIX } } }, { slot: FIXTURE_SLOTS }],
    },
  });
  await db.slot.deleteMany({ where: FIXTURE_SLOTS });
  await db.service.deleteMany({
    where: { slug: { startsWith: SLUG_PREFIX } },
  });
}

/** Active, because `loadBookingContext` only resolves active services. */
export function createFixtureService(priceCents = 4500) {
  return db.service.create({
    data: {
      slug: FIXTURE_SERVICE_SLUG,
      name: "Fixture session",
      description: "Created by the test suite.",
      priceCents,
      active: true,
    },
  });
}

/** A service that exists but is withdrawn, which is not the same as absent. */
export function createInactiveFixtureService() {
  return db.service.create({
    data: {
      slug: FIXTURE_INACTIVE_SERVICE_SLUG,
      name: "Withdrawn fixture session",
      description: "Created by the test suite.",
      priceCents: 4500,
      active: false,
    },
  });
}

export function createFixtureSlot(offsetHours = 0) {
  const startsAt = new Date(FIXTURE_EPOCH.getTime() + offsetHours * ONE_HOUR_MS);
  return db.slot.create({
    data: { startsAt, endsAt: new Date(startsAt.getTime() + ONE_HOUR_MS) },
  });
}

export function createPastFixtureSlot(offsetHours = 0) {
  const startsAt = new Date(
    FIXTURE_PAST_EPOCH.getTime() + offsetHours * ONE_HOUR_MS,
  );
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
