"use client";

import { useActionState } from "react";
import { saveDetails, type DetailsFormState } from "@/app/book/details/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { BookingDetails, BookingSelection } from "@/lib/validation";

const INITIAL: DetailsFormState = {};

/**
 * Client component so validation errors come back without losing what the
 * parent typed.
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
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="service" value={selection.service} />
      <input type="hidden" name="level" value={selection.level} />
      <input type="hidden" name="year" value={selection.year} />
      <input type="hidden" name="subject" value={selection.subject} />
      <input type="hidden" name="slot" value={selection.slot} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Parent / guardian name" error={errors.parentName}>
          <Input
            name="parentName"
            required
            autoComplete="name"
            defaultValue={values?.parentName ?? ""}
            aria-invalid={Boolean(errors.parentName)}
          />
        </Field>

        <Field label="Student name" error={errors.studentName}>
          <Input
            name="studentName"
            required
            defaultValue={values?.studentName ?? ""}
            aria-invalid={Boolean(errors.studentName)}
          />
        </Field>

        <Field
          label="Email"
          hint="Where we send the confirmation"
          error={errors.parentEmail}
        >
          <Input
            type="email"
            name="parentEmail"
            required
            autoComplete="email"
            defaultValue={values?.parentEmail ?? ""}
            aria-invalid={Boolean(errors.parentEmail)}
          />
        </Field>

        <Field label="Phone" hint="Optional" error={errors.parentPhone}>
          <Input
            type="tel"
            name="parentPhone"
            autoComplete="tel"
            defaultValue={values?.parentPhone ?? ""}
            aria-invalid={Boolean(errors.parentPhone)}
          />
        </Field>
      </div>

      {state.formError && (
        <p className="text-sm text-red-600" role="alert">
          {state.formError}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Checking…" : "Review booking"}
      </Button>
    </form>
  );
}
