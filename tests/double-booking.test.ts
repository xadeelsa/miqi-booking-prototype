import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { createBooking } from "@/lib/booking";
import { db } from "@/lib/db";
import {
  bookingInputFor,
  createFixtureService,
  createFixtureSlot,
  resetFixtures,
} from "./fixtures";

/**
 * A slot cannot be booked twice. Real Postgres, because the protection is a
 * UNIQUE constraint and a mocked Prisma would only prove the mock.
 */

const CONCURRENT_ATTEMPTS = 10;
const DISTINCT_SLOTS = 20;

// Matches the reference alphabet: digits 2-9 and letters minus I, L, O and U.
const REFERENCE_PATTERN = /^MIQI-[2-9A-HJKMNP-TV-Z]{5}$/;

beforeEach(resetFixtures);

afterAll(async () => {
  await resetFixtures();
  await db.$disconnect();
});

describe("createBooking", () => {
  test("books a free slot and prices it from the service row", async () => {
    const service = await createFixtureService();
    const slot = await createFixtureSlot();

    const result = await createBooking(bookingInputFor(service.slug, slot.id));

    expect(result).toStrictEqual({
      ok: true,
      reference: expect.stringMatching(REFERENCE_PATTERN),
      priceCents: service.priceCents,
    });

    const stored = await db.booking.findUniqueOrThrow({
      where: { slotId: slot.id },
    });
    expect(stored.paymentStatus).toBe("PAID");
    expect(stored.parentEmail).toBe("anne.devries@example.nl");
    expect(stored.priceCents).toBe(service.priceCents);
  });

  test("refuses a slot that is already booked", async () => {
    const service = await createFixtureService();
    const slot = await createFixtureSlot();
    const input = bookingInputFor(service.slug, slot.id);

    await createBooking(input);

    expect(await createBooking(input)).toStrictEqual({
      ok: false,
      reason: "taken",
    });
    expect(await db.booking.count({ where: { slotId: slot.id } })).toBe(1);
  });

  test(`exactly one of ${CONCURRENT_ATTEMPTS} simultaneous attempts on the same slot succeeds`, async () => {
    const service = await createFixtureService();
    const slot = await createFixtureSlot();
    const input = bookingInputFor(service.slug, slot.id);

    // Every attempt sees a free slot, so nothing but the unique constraint
    // stands between them and ten bookings for one hour.
    const results = await Promise.all(
      Array.from({ length: CONCURRENT_ATTEMPTS }, () => createBooking(input)),
    );

    const references = results.flatMap((r) => (r.ok ? [r.reference] : []));
    const reasons = results.flatMap((r) => (r.ok ? [] : [r.reason]));

    expect(references).toHaveLength(1);

    // Losing is an ordinary outcome: none of these threw.
    expect(reasons).toStrictEqual(
      Array(CONCURRENT_ATTEMPTS - 1).fill("taken"),
    );

    expect(await db.booking.count({ where: { slotId: slot.id } })).toBe(1);
  });

  test(`books ${DISTINCT_SLOTS} different slots at once, all of them successfully`, async () => {
    // Guards the opposite failure: a constraint that rejected everything.
    const service = await createFixtureService();
    const slots = await Promise.all(
      Array.from({ length: DISTINCT_SLOTS }, (_, i) => createFixtureSlot(i)),
    );

    const results = await Promise.all(
      slots.map((slot) => createBooking(bookingInputFor(service.slug, slot.id))),
    );

    const references = results.flatMap((r) => (r.ok ? [r.reference] : []));

    expect(references).toHaveLength(DISTINCT_SLOTS);
    expect(new Set(references).size).toBe(DISTINCT_SLOTS);
    expect(await db.booking.count({ where: { serviceId: service.id } })).toBe(
      DISTINCT_SLOTS,
    );
  });
});
