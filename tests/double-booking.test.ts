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
 * The guarantee the whole design rests on: a slot cannot be booked twice, even
 * when the winner is decided by microseconds rather than by turn-taking.
 *
 * These tests talk to a real Postgres deliberately. The protection is a UNIQUE
 * constraint, which is a database feature - a mocked Prisma would only prove
 * that the mock does what the test told it to.
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
    // The request never carries an amount, so this can only have come from the
    // service the booking was priced against.
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

    // Each attempt checks availability before writing, and right now the slot
    // is free - so the check waves all ten of them through. Nothing but the
    // unique constraint stands between them and ten bookings for one hour of
    // one tutor's time.
    const results = await Promise.all(
      Array.from({ length: CONCURRENT_ATTEMPTS }, () => createBooking(input)),
    );

    const references = results.flatMap((r) => (r.ok ? [r.reference] : []));
    const reasons = results.flatMap((r) => (r.ok ? [] : [r.reason]));

    expect(references).toHaveLength(1);

    // Losing is an ordinary outcome rather than an exception: none of these
    // threw, and every loser came back knowing why.
    expect(reasons).toStrictEqual(
      Array(CONCURRENT_ATTEMPTS - 1).fill("taken"),
    );

    // And the part that actually matters - the database agrees.
    expect(await db.booking.count({ where: { slotId: slot.id } })).toBe(1);
  });

  test(`books ${DISTINCT_SLOTS} different slots at once, all of them successfully`, async () => {
    // Guards the opposite failure: a constraint that rejected everything after
    // the first booking would satisfy the test above just as well.
    const service = await createFixtureService();
    const slots = await Promise.all(
      Array.from({ length: DISTINCT_SLOTS }, (_, i) => createFixtureSlot(i)),
    );

    const results = await Promise.all(
      slots.map((slot) => createBooking(bookingInputFor(service.slug, slot.id))),
    );

    const references = results.flatMap((r) => (r.ok ? [r.reference] : []));

    expect(references).toHaveLength(DISTINCT_SLOTS);
    // Every booking gets its own reference, which is the other unique column.
    expect(new Set(references).size).toBe(DISTINCT_SLOTS);
    expect(await db.booking.count({ where: { serviceId: service.id } })).toBe(
      DISTINCT_SLOTS,
    );
  });
});
