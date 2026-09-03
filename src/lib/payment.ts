import type { PaymentOutcome } from "./validation";

/**
 * Stand-in for a payment provider — Mollie or Stripe in production, given a
 * Dutch customer base and iDEAL.
 *
 * The outcome is chosen by the caller rather than randomised. Demonstrating
 * the decline path has to be repeatable, and a prototype that fails one time
 * in five is worse than one that is transparently fake.
 *
 * A real charge would take the amount, the currency and an idempotency key,
 * and would hand back a provider reference to store against the booking. The
 * async signature is kept so that swapping the implementation doesn't ripple
 * out into the caller.
 */

export type PaymentResult =
  | { paid: true }
  | { paid: false; message: string };

const DECLINE_MESSAGE =
  "The payment was declined. Nothing has been charged and this time is still free — you can try again.";

export async function chargeCard(
  outcome: PaymentOutcome,
): Promise<PaymentResult> {
  if (outcome === "failure") return { paid: false, message: DECLINE_MESSAGE };
  return { paid: true };
}
