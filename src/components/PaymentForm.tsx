"use client";

import { useActionState } from "react";
import type { PaymentState } from "@/app/book/payment/actions";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

const INITIAL: PaymentState = {};

/**
 * Two submit buttons in one form, distinguished by their `value` — the
 * clicked button's value is what reaches the action, so the decline path is
 * reachable without a radio group nobody would use.
 */
export function PaymentForm({
  action,
  priceCents,
}: {
  action: (state: PaymentState, formData: FormData) => Promise<PaymentState>;
  priceCents: number;
}) {
  // A successful payment redirects to the confirmation page, so the only
  // state this form ever renders is a decline.
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="mt-6">
      {state.error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="outcome" value="success" disabled={pending}>
          {pending ? "Processing…" : `Pay ${formatPrice(priceCents)}`}
        </Button>
        <Button
          type="submit"
          name="outcome"
          value="failure"
          variant="secondary"
          disabled={pending}
        >
          Simulate a declined payment
        </Button>
      </div>
    </form>
  );
}
