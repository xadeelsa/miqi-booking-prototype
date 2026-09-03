import {
  loadBookingContext,
  type BookingContext,
  type UnavailableReason,
} from "./booking";
import { readDetailsDraft } from "./draft";
import {
  parseBookingSelection,
  type BookingDetails,
  type BookingSelection,
} from "./validation";

/**
 * The preamble every step after slot selection needs: validate the query
 * string, resolve it against the database, price it, and pick up the contact
 * details if the parent has entered them.
 *
 * It lives apart from `booking.ts` on purpose. Reading the draft touches
 * `next/headers`, and pulling that into the booking domain would drag a
 * request context into `createBooking` - which is a plain database function
 * that the tests import directly.
 *
 * `details` is deliberately nullable rather than enforced here: the details
 * step is where they get entered, and the later steps refuse to continue
 * without them. Leaving it in the type means a page cannot use the details
 * without first deciding what to do when they are missing.
 */
export type FunnelStep =
  | { status: "invalid" }
  | { status: "unavailable"; selection: BookingSelection; reason: UnavailableReason }
  | {
      status: "ready";
      selection: BookingSelection;
      service: Extract<BookingContext, { ok: true }>["service"];
      slot: Extract<BookingContext, { ok: true }>["slot"];
      priceCents: number;
      details: BookingDetails | null;
    };

export async function resolveFunnelStep(
  searchParams: unknown,
): Promise<FunnelStep> {
  const selection = parseBookingSelection(searchParams);
  if (!selection) return { status: "invalid" };

  const context = await loadBookingContext(selection);
  if (!context.ok) {
    return { status: "unavailable", selection, reason: context.reason };
  }

  return {
    status: "ready",
    selection,
    service: context.service,
    slot: context.slot,
    priceCents: context.priceCents,
    details: await readDetailsDraft(),
  };
}
