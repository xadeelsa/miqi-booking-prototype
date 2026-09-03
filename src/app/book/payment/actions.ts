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
 * Charge, then write the row. The selection arrives as a bound action argument
 * and is still re-validated, because a Booking row needs it with the details.
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
    // A decline writes nothing, so the slot stays free. It also means a row
    // only ever exists as PAID, leaving PENDING and FAILED unreachable
    // (README limitations).
    return { error: payment.message };
  }

  const result = await createBooking(input.data);
  if (!result.ok) {
    // Paid, but lost the slot. Against a real provider this is the branch
    // that has to void or refund before reporting back.
    return { error: UNAVAILABLE_MESSAGES[result.reason] };
  }

  // The Booking row is the record from here on.
  await clearDetailsDraft();

  await sendConfirmationEmail(result.reference);

  redirect(confirmationHref(result.reference));
}

/** After the row is stored: a mail failure must not look like a failed booking. */
async function sendConfirmationEmail(reference: string): Promise<void> {
  try {
    const booking = await getBookingByReference(reference);
    if (booking) await sendEmail(bookingConfirmationEmail(booking));
  } catch (error) {
    console.error(`Confirmation email failed for ${reference}`, error);
  }
}
