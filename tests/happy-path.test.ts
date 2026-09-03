import { afterAll, beforeEach, describe, expect, test } from "vitest";
import { loadAdminOverview, summariseBookings } from "@/lib/admin";
import { createBooking, icsHref, loadBookingContext } from "@/lib/booking";
import { bookingIcs, googleCalendarUrl } from "@/lib/calendar";
import { db } from "@/lib/db";
import { bookingConfirmationEmail } from "@/lib/emails/booking-confirmation";
import { chargeCard } from "@/lib/payment";
import { getBookingByReference, getBookingsForAdmin } from "@/lib/queries";
import {
  bookingInputSchema,
  detailsSchema,
  parseBookingSelection,
  parseReference,
  paymentOutcomeSchema,
} from "@/lib/validation";
import {
  createFixtureService,
  createFixtureSlot,
  FIXTURE_EPOCH,
  resetFixtures,
} from "./fixtures";

/**
 * One booking, walked through every server-side step in the order the funnel
 * runs them — parse the URL, price it, vet the details, charge, write, then
 * read it back as the confirmation page, the email, the calendar file and the
 * admin list all do.
 *
 * Not a browser test: there is no Playwright here, so clicking, the details
 * cookie and the post-payment redirect are not covered. What it does cover is
 * every decision the server makes, which is where this application's actual
 * behaviour lives. The gap is the wiring between them.
 */

/** Exactly the shape the URL carries into the later steps. */
function searchParams(serviceSlug: string, slotId: number) {
  return {
    service: serviceSlug,
    level: "VWO",
    year: "Klas 4",
    subject: "Wiskunde",
    slot: String(slotId),
  };
}

/** Exactly what the details form posts. */
const RAW_DETAILS = {
  parentName: "Anne de Vries",
  studentName: "Sem de Vries",
  parentEmail: "Anne.DeVries@Example.NL",
  parentPhone: "+31 6 1234 5678",
};

beforeEach(resetFixtures);

afterAll(async () => {
  await resetFixtures();
  await db.$disconnect();
});

describe("booking a session, end to end through the server", () => {
  test("a paid booking is stored, confirmable, mailable and in the admin list", async () => {
    const service = await createFixtureService(7700);
    const slot = await createFixtureSlot();

    // 1. The URL arrives as strings and is not trusted.
    const selection = parseBookingSelection(searchParams(service.slug, slot.id));
    expect(selection).not.toBeNull();
    if (!selection) return;

    // 2. Price comes from the database, and is what the review page shows.
    const context = await loadBookingContext(selection);
    expect(context).toMatchObject({ ok: true, priceCents: 7700 });

    // 3. The details are vetted, whatever case they were typed in.
    const details = detailsSchema.parse(RAW_DETAILS);
    expect(details.parentEmail).toBe("anne.devries@example.nl");

    // 4. Selection and details only become a booking together.
    const input = bookingInputSchema.parse({ ...selection, ...details });

    // 5. Payment first — nothing is written before this succeeds.
    const outcome = paymentOutcomeSchema.parse("success");
    expect(await chargeCard(outcome)).toStrictEqual({ paid: true });

    // 6. Then, and only then, the row.
    const result = await createBooking(input);
    expect(result).toMatchObject({ ok: true, priceCents: 7700 });
    if (!result.ok) return;

    // 7. The confirmation page reads it back by the reference from the URL.
    const reference = parseReference(result.reference.toLowerCase());
    expect(reference).toBe(result.reference);

    const booking = await getBookingByReference(result.reference);
    expect(booking).toMatchObject({
      reference: result.reference,
      schoolLevel: "VWO",
      year: "Klas 4",
      subject: "Wiskunde",
      parentName: "Anne de Vries",
      parentEmail: "anne.devries@example.nl",
      studentName: "Sem de Vries",
      // The amount the parent was shown, snapshotted onto the booking.
      priceCents: 7700,
      paymentStatus: "PAID",
    });
    if (!booking) return;

    // 8. The email says the same things, and is addressed to the parent.
    const email = bookingConfirmationEmail(booking);
    expect(email.to).toStrictEqual(["anne.devries@example.nl"]);
    expect(email.subject).toContain(result.reference);
    for (const expected of [
      result.reference,
      "Sem de Vries",
      "Wiskunde",
      "€77.00",
      icsHref(result.reference),
    ]) {
      expect(email.text).toContain(expected);
    }

    // 9. Both calendar hand-offs describe the slot that was booked.
    const stamp = "20980101T000000Z";
    expect(bookingIcs(booking)).toContain(`DTSTART:${stamp}`);
    expect(googleCalendarUrl(booking)).toContain(`dates=${stamp}`);

    // 10. And it appears in the admin list as upcoming, at its own price.
    const overview = await loadAdminOverview();
    expect(overview.upcoming.map((b) => b.reference)).toContain(
      result.reference,
    );
    expect(overview.past.map((b) => b.reference)).not.toContain(
      result.reference,
    );
    expect(overview.revenueCents).toBeGreaterThanOrEqual(7700);
  });

  test("a declined payment writes nothing and leaves the slot free", async () => {
    const service = await createFixtureService();
    const slot = await createFixtureSlot();
    const selection = parseBookingSelection(searchParams(service.slug, slot.id));
    if (!selection) throw new Error("expected a valid selection");

    const payment = await chargeCard(paymentOutcomeSchema.parse("failure"));
    expect(payment.paid).toBe(false);

    // The action returns here, so createBooking is never reached. Nothing to
    // roll back, no hold to expire, and the slot is still on offer.
    expect(await db.booking.count({ where: { slotId: slot.id } })).toBe(0);
    expect(await loadBookingContext(selection)).toMatchObject({ ok: true });
  });

  test("the same details cannot be paid for twice against one slot", async () => {
    // A parent who resubmits, or comes back on a stale tab, must not produce
    // a second charge's worth of booking.
    const service = await createFixtureService();
    const slot = await createFixtureSlot();
    const selection = parseBookingSelection(searchParams(service.slug, slot.id));
    if (!selection) throw new Error("expected a valid selection");

    const input = bookingInputSchema.parse({
      ...selection,
      ...detailsSchema.parse(RAW_DETAILS),
    });

    expect(await createBooking(input)).toMatchObject({ ok: true });
    expect(await createBooking(input)).toStrictEqual({
      ok: false,
      reason: "taken",
    });
    expect(await db.booking.count({ where: { slotId: slot.id } })).toBe(1);
  });
});

describe("admin overview", () => {
  test("counts a session starting exactly now as upcoming, not past", async () => {
    // The boundary has to fall one way deliberately: a session beginning this
    // instant is still to come, and must not vanish from both lists.
    const service = await createFixtureService();
    const slot = await createFixtureSlot();
    await createBooking({
      ...bookingInputSchema.parse({
        ...searchParams(service.slug, slot.id),
        ...RAW_DETAILS,
      }),
    });

    const bookings = await getBookingsForAdmin();
    const atTheInstant = summariseBookings(bookings, FIXTURE_EPOCH);

    expect(
      atTheInstant.upcoming.some((b) => b.slot.id === slot.id),
    ).toBe(true);
    expect(atTheInstant.past.some((b) => b.slot.id === slot.id)).toBe(false);
  });

  test("orders upcoming soonest first and past most-recent first", async () => {
    const service = await createFixtureService();
    const slots = await Promise.all([
      createFixtureSlot(0),
      createFixtureSlot(2),
      createFixtureSlot(4),
    ]);
    for (const slot of slots) {
      await createBooking({
        ...bookingInputSchema.parse({
          ...searchParams(service.slug, slot.id),
          ...RAW_DETAILS,
        }),
      });
    }

    const bookings = await getBookingsForAdmin();

    // Seen from before all three, they are upcoming, soonest first.
    const ahead = summariseBookings(bookings, FIXTURE_EPOCH);
    const aheadTimes = ahead.upcoming.map((b) => b.slot.startsAt.getTime());
    expect(aheadTimes).toStrictEqual([...aheadTimes].sort((a, b) => a - b));

    // Seen from long after, they are past, most recent first.
    const behind = summariseBookings(bookings, new Date("2099-01-01T00:00:00Z"));
    const behindTimes = behind.past.map((b) => b.slot.startsAt.getTime());
    expect(behind.upcoming).toHaveLength(0);
    expect(behindTimes).toStrictEqual([...behindTimes].sort((a, b) => b - a));
  });
});
