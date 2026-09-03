"use server";

import { redirect } from "next/navigation";
import {
  confirmationHref,
  createBooking,
  UNAVAILABLE_MESSAGES,
} from "@/lib/booking";
import { clearDetailsDraft, readDetailsDraft } from "@/lib/draft";
import { sendEmail } from "@/lib/email";
import { bookingConfirmationEmail } from "@/lib/emails/booking-confirmation";
import { chargeCard } from "@/lib/payment";
import { getBookingByReference } from "@/lib/queries";
import {
  bookingInputSchema,
  paymentOutcomeSchema,
  type BookingSelection,
} from "@/lib/validation";

export type PaymentState = {
  error?: string;
};

/**
 * Charge, then book — the order create-on-pay demands.
 *
 * The selection is a bound (encrypted) action argument rather than hidden
 * inputs, since this page has nothing editable on it, and it still goes back
 * through the schema with the details because a Booking row needs them as one
 * object.
 */
export async function payAndBook(
  selection: BookingSelection,
  _previous: PaymentState,
  formData: FormData,
): Promise<PaymentState> {
  const outcome = paymentOutcomeSchema.safeParse(formData.get("outcome"));
  if (!outcome.success) {
    return { error: "That payment option isn't recognised." };
  }

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

  const payment = await chargeCard(outcome.data);
  if (!payment.paid) {
    // A decline writes nothing at all. That is the whole point of
    // create-on-pay: the slot is still free, for this parent to retry or for
    // anyone else to take. It also means a Booking row only ever exists in the
    // PAID state, so PaymentStatus.PENDING and FAILED are currently
    // unreachable — recording attempts would need a separate table that
    // doesn't hold a slot (noted in the README's limitations).
    return { error: payment.message };
  }

  const result = await createBooking(input.data);
  if (!result.ok) {
    // Paid, but lost the slot in the gap between charging and inserting. The
    // simulated charge is instant so the window is nil here, but against a
    // real provider this is the branch that has to void or refund before
    // reporting back — the one cost of charging before writing.
    return { error: UNAVAILABLE_MESSAGES[result.reason] };
  }

  // Dropped before the redirect, so the contact details don't outlive the
  // funnel — from here on the Booking row is the record.
  await clearDetailsDraft();

  await sendConfirmationEmail(result.reference);

  redirect(confirmationHref(result.reference));
}

/**
 * Best effort, and deliberately after the booking is safely stored: the
 * session is paid for either way, so a mail failure must not present itself
 * as a failed booking. Awaiting it inline keeps the prototype's log readable;
 * a real system would hand this to a queue with retries.
 */
async function sendConfirmationEmail(reference: string): Promise<void> {
  try {
    const booking = await getBookingByReference(reference);
    if (booking) await sendEmail(bookingConfirmationEmail(booking));
  } catch (error) {
    console.error(`Confirmation email failed for ${reference}`, error);
  }
}
