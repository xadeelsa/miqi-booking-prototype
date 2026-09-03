"use server";

import { createBooking, UNAVAILABLE_MESSAGES } from "@/lib/booking";
import { readDetailsDraft } from "@/lib/draft";
import { bookingInputSchema, type BookingSelection } from "@/lib/validation";

export type ConfirmState = {
  error?: string;
  booked?: { reference: string; priceCents: number };
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

  // M5 inserts the simulated payment step here. Create-on-pay means the row
  // is written only once money has moved, so until payment exists confirming
  // books directly.
  const result = await createBooking(input.data);

  // "taken" is the expected answer when two parents confirm the same slot at
  // once, so it reads as an ordinary message rather than a failure.
  if (!result.ok) return { error: UNAVAILABLE_MESSAGES[result.reason] };

  return {
    booked: { reference: result.reference, priceCents: result.priceCents },
  };
}
