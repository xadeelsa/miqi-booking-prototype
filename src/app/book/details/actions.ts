"use server";

import { redirect } from "next/navigation";
import {
  loadBookingContext,
  selectionQuery,
  UNAVAILABLE_MESSAGES,
} from "@/lib/booking";
import { saveDetailsDraft } from "@/lib/draft";
import {
  bookingInputSchema,
  DETAIL_FIELDS,
  fieldErrors,
  type DetailField,
} from "@/lib/validation";

export type DetailsFormState = {
  /**
   * Echoed back so the form can repopulate itself. React resets an
   * uncontrolled form once the action resolves, so without this a rejected
   * submit would wipe everything the parent typed.
   */
  values?: Partial<Record<DetailField, string>>;
  errors?: Partial<Record<DetailField, string>>;
  formError?: string;
};

function isDetailField(key: string): key is DetailField {
  return (DETAIL_FIELDS as readonly string[]).includes(key);
}

export async function saveDetails(
  _previous: DetailsFormState,
  formData: FormData,
): Promise<DetailsFormState> {
  const raw = Object.fromEntries(formData);

  // Whatever the parent typed, kept verbatim for the re-render.
  const values: Partial<Record<DetailField, string>> = {};
  for (const field of DETAIL_FIELDS) values[field] = String(raw[field] ?? "");

  // The selection travels in hidden inputs, so it is validated here together
  // with the details rather than taken on trust.
  const parsed = bookingInputSchema.safeParse(raw);

  if (!parsed.success) {
    const issues = fieldErrors(parsed.error);
    const errors: Partial<Record<DetailField, string>> = {};
    let selectionBroken = false;

    for (const [key, message] of Object.entries(issues)) {
      if (isDetailField(key)) errors[key] = message;
      else selectionBroken = true;
    }

    return {
      values,
      errors,
      // Nothing on this form can fix a bad service, level or slot - that needs
      // a step back, so it is reported separately from the field errors.
      formError: selectionBroken
        ? "Your earlier choices are no longer valid. Please pick a service and time again."
        : undefined,
    };
  }

  // Cheap to check, and much friendlier than letting the parent fill in the
  // whole form only to be turned away on the review page.
  const context = await loadBookingContext(parsed.data);
  if (!context.ok) {
    return { values, formError: UNAVAILABLE_MESSAGES[context.reason] };
  }

  const { parentName, parentEmail, parentPhone, studentName } = parsed.data;
  await saveDetailsDraft({ parentName, parentEmail, parentPhone, studentName });

  redirect(`/book/review?${selectionQuery(parsed.data)}`);
}
