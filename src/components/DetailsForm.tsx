"use client";

import { useActionState } from "react";
import { saveDetails, type DetailsFormState } from "@/app/book/details/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { BookingSelection } from "@/lib/booking";
import type { BookingDetails } from "@/lib/draft";

const INITIAL: DetailsFormState = {};

/**
 * Client component only so the parent gets validation errors back without
 * losing what they typed. The selection travels in hidden inputs and is
 * re-validated server-side — these fields are a convenience, not a source of
 * truth.
 */
export function DetailsForm({
  selection,
  defaults,
}: {
  selection: BookingSelection;
  defaults: BookingDetails | null;
}) {
  const [state, formAction, pending] = useActionState(saveDetails, INITIAL);

  // A rejected submit wins over the saved draft, so a correction survives.
  const values = state.values ?? defaults;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="service" value={selection.service} />
      <input type="hidden" name="level" value={selection.level} />
      <input type="hidden" name="year" value={selection.year} />
      <input type="hidden" name="subject" value={selection.subject} />
      <input type="hidden" name="slot" value={selection.slot} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Parent / guardian name">
          <Input
            name="parentName"
            required
            autoComplete="name"
            defaultValue={values?.parentName ?? ""}
          />
        </Field>

        <Field label="Student name">
          <Input
            name="studentName"
            required
            defaultValue={values?.studentName ?? ""}
          />
        </Field>

        <Field label="Email" hint="Where we send the confirmation">
          <Input
            type="email"
            name="parentEmail"
            required
            autoComplete="email"
            defaultValue={values?.parentEmail ?? ""}
          />
        </Field>

        <Field label="Phone" hint="Optional">
          <Input
            type="tel"
            name="parentPhone"
            autoComplete="tel"
            defaultValue={values?.parentPhone ?? ""}
          />
        </Field>
      </div>

      {state.formError && (
        <p className="text-sm text-red-600">{state.formError}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Review booking"}
      </Button>
    </form>
  );
}
