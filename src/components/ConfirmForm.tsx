"use client";

import { useActionState } from "react";
import type { ConfirmState } from "@/app/book/review/actions";
import { Button } from "@/components/ui/Button";
import { Note } from "@/components/ui/Note";
import { formatPrice } from "@/lib/format";

const INITIAL: ConfirmState = {};

export function ConfirmForm({
  action,
}: {
  action: (state: ConfirmState, formData: FormData) => Promise<ConfirmState>;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  // Once the slot is booked there is nothing left to submit — offering the
  // button again would only earn the parent a "someone else booked that time"
  // about their own booking.
  if (state.booked) {
    return (
      <Note className="mt-6 text-ink">
        Booked. Your reference is{" "}
        <strong className="font-semibold tracking-wide">
          {state.booked.reference}
        </strong>
        , and {formatPrice(state.booked.priceCents)} has been charged. A
        confirmation page and email follow in a later step.
      </Note>
    );
  }

  return (
    <form action={formAction} className="mt-6">
      {state.error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Booking…" : "Confirm booking"}
      </Button>
    </form>
  );
}
