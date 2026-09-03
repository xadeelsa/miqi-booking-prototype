import type { PaymentOutcome } from "./validation";

/**
 * Stand-in for a payment provider. The outcome is chosen by the caller rather
 * than randomised, so the decline path is repeatable.
 */

export type PaymentResult =
  | { paid: true }
  | { paid: false; message: string };

const DECLINE_MESSAGE =
  "The payment was declined. Nothing has been charged and this time is still free, so you can try again.";

export async function chargeCard(
  outcome: PaymentOutcome,
): Promise<PaymentResult> {
  if (outcome === "failure") return { paid: false, message: DECLINE_MESSAGE };
  return { paid: true };
}
