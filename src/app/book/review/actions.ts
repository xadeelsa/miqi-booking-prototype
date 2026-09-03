"use server";

import { loadBookingContext, UNAVAILABLE_MESSAGES } from "@/lib/booking";
import { readDetailsDraft } from "@/lib/draft";
import { bookingInputSchema, type BookingSelection } from "@/lib/validation";

export type ConfirmState = {
  error?: string;
  /** Set once the whole booking has cleared the server boundary. */
  ready?: { priceCents: number };
};

/**
 * The last gate before money changes hands.
 *
 * The selection is closed over rather than posted in hidden inputs — Next
 * encrypts server-action arguments, and the review page has no editable fields
 * anyway. It still goes back through the schema alongside the details, because
 * the two halves were validated separately and a Booking row needs them as one
 * object; that is also what catches a details cookie left over from a
 * different selection.
 */
export async function confirmBooking(
  selection: BookingSelection,
  _previous: ConfirmState,
  _formData: FormData,
): Promise<ConfirmState> {
  const details = await readDetailsDraft();
  if (!details) {
    return {
      error: "We no longer have your contact details. Please enter them again.",
    };
  }

  const input = bookingInputSchema.safeParse({ ...selection, ...details });
  if (!input.success) {
    return {
      error: "Something in this booking is incomplete. Please check your details.",
    };
  }

  // Priced and re-checked here rather than trusting the page that rendered the
  // summary, so a slot taken while the parent was reading is caught now.
  const context = await loadBookingContext(input.data);
  if (!context.ok) return { error: UNAVAILABLE_MESSAGES[context.reason] };

  // M4 writes the Booking from here: created on successful payment, with the
  // slotId unique constraint deciding the winner if two parents confirm the
  // same slot at once.
  return { ready: { priceCents: context.priceCents } };
}
