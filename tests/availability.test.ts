import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { createBooking, loadBookingContext } from "@/lib/booking";
import { db } from "@/lib/db";
import { getAvailableSlots } from "@/lib/queries";
import type { BookingSelection } from "@/lib/validation";
import {
  bookingInputFor,
  createFixtureService,
  createFixtureSlot,
  createInactiveFixtureService,
  createPastFixtureSlot,
  FIXTURE_INACTIVE_SERVICE_SLUG,
  resetFixtures,
} from "./fixtures";

/**
 * What the funnel treats as bookable, and why it says no when it says no.
 *
 * Every step from the details form onward runs through `loadBookingContext`,
 * so a parent who sits on a form while their slot disappears gets told which
 * thing went away rather than a generic failure. Against a real database,
 * because "is this slot free" is a question about rows.
 */

function selectionFor(serviceSlug: string, slotId: number): BookingSelection {
  return bookingInputFor(serviceSlug, slotId);
}

beforeEach(resetFixtures);

afterAll(async () => {
  await resetFixtures();
  await db.$disconnect();
});

describe("loadBookingContext", () => {
  test("resolves a free future slot and prices it from the service row", async () => {
    // A price that no default or literal in the codebase could accidentally
    // match, so the assertion can only pass if it was read from the row.
    const service = await createFixtureService(7700);
    const slot = await createFixtureSlot();

    const context = await loadBookingContext(selectionFor(service.slug, slot.id));

    expect(context).toStrictEqual({
      ok: true,
      service: expect.objectContaining({ id: service.id, slug: service.slug }),
      slot: expect.objectContaining({ id: slot.id }),
      priceCents: 7700,
    });
  });

  test("says 'service' when the slug matches nothing", async () => {
    const slot = await createFixtureSlot();

    expect(await loadBookingContext(selectionFor("no-such-service", slot.id)))
      .toStrictEqual({ ok: false, reason: "service" });
  });

  test("says 'service' when the service exists but has been withdrawn", async () => {
    // Withdrawn is not the same as absent, and it must not be bookable just
    // because someone kept an old link.
    await createInactiveFixtureService();
    const slot = await createFixtureSlot();

    expect(
      await loadBookingContext(
        selectionFor(FIXTURE_INACTIVE_SERVICE_SLUG, slot.id),
      ),
    ).toStrictEqual({ ok: false, reason: "service" });
  });

  test("says 'slot' when the slot id is not in the schedule", async () => {
    const service = await createFixtureService();

    expect(await loadBookingContext(selectionFor(service.slug, 2_000_000_000)))
      .toStrictEqual({ ok: false, reason: "slot" });
  });

  test("says 'taken' once the slot has a booking", async () => {
    const service = await createFixtureService();
    const slot = await createFixtureSlot();
    await createBooking(bookingInputFor(service.slug, slot.id));

    expect(await loadBookingContext(selectionFor(service.slug, slot.id)))
      .toStrictEqual({ ok: false, reason: "taken" });
  });

  test("says 'past' when the session has already started", async () => {
    const service = await createFixtureService();
    const slot = await createPastFixtureSlot();

    expect(await loadBookingContext(selectionFor(service.slug, slot.id)))
      .toStrictEqual({ ok: false, reason: "past" });
  });

  test("refuses to book a past slot even though nobody else has it", async () => {
    // The pre-check is the only thing standing here — the unique constraint
    // has no opinion about time.
    const service = await createFixtureService();
    const slot = await createPastFixtureSlot();

    expect(await createBooking(bookingInputFor(service.slug, slot.id)))
      .toStrictEqual({ ok: false, reason: "past" });
    expect(await db.booking.count({ where: { slotId: slot.id } })).toBe(0);
  });
});

describe("getAvailableSlots", () => {
  test("offers free future slots, and hides booked and past ones", async () => {
    const service = await createFixtureService();
    const [free, booked] = await Promise.all([
      createFixtureSlot(0),
      createFixtureSlot(1),
    ]);
    const past = await createPastFixtureSlot();

    await createBooking(bookingInputFor(service.slug, booked.id));

    const offered = (await getAvailableSlots()).map((slot) => slot.id);

    expect(offered).toContain(free.id);
    // Booked, so gone — the whole reason the list is derived from bookings
    // rather than from a status column somebody has to remember to update.
    expect(offered).not.toContain(booked.id);
    expect(offered).not.toContain(past.id);
  });

  test("returns slots in chronological order", async () => {
    // The slot picker groups by day and renders in order; it relies on this
    // rather than sorting again.
    await Promise.all([
      createFixtureSlot(5),
      createFixtureSlot(1),
      createFixtureSlot(3),
    ]);

    const times = (await getAvailableSlots()).map((slot) =>
      slot.startsAt.getTime(),
    );

    expect(times).toStrictEqual([...times].sort((a, b) => a - b));
  });
});
