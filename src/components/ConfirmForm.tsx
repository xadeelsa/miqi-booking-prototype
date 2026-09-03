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

  return (
    <form action={formAction} className="mt-6">
      {state.error && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      {state.ready && (
        <Note className="mb-4">
          Checked — this time is still free and {formatPrice(state.ready.priceCents)}{" "}
          is due. Payment isn&apos;t connected yet.
        </Note>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Continue to payment"}
      </Button>
    </form>
  );
}
