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
 * Validates the query string, resolves it against the database, prices it and
 * reads the draft cookie. Separate from `booking.ts` because this touches
 * `next/headers`, which would drag a request context into `createBooking`.
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
