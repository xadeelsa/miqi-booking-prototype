"use server";

import { redirect } from "next/navigation";
import { saveDetailsDraft, type BookingDetails } from "@/lib/draft";

export type DetailsFormState = {
  /**
   * Echoed back so the form can repopulate itself. React resets an
   * uncontrolled form once the action resolves, so without this a failed
   * submit would wipe everything the parent typed.
   */
  values?: BookingDetails;
  formError?: string;
};

function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

export async function saveDetails(
  _previous: DetailsFormState,
  formData: FormData,
): Promise<DetailsFormState> {
  const details: BookingDetails = {
    parentName: text(formData, "parentName"),
    parentEmail: text(formData, "parentEmail"),
    parentPhone: text(formData, "parentPhone") || undefined,
    studentName: text(formData, "studentName"),
  };

  if (!details.parentName || !details.studentName || !details.parentEmail) {
    return { values: details, formError: "Please fill in the required fields." };
  }

  await saveDetailsDraft(details);

  // The selection is passed straight through: the review page re-reads the
  // service, the slot and the price from the database, so it is validated
  // there rather than trusted here.
  const query = new URLSearchParams({
    service: text(formData, "service"),
    level: text(formData, "level"),
    year: text(formData, "year"),
    subject: text(formData, "subject"),
    slot: text(formData, "slot"),
  });

  redirect(`/book/review?${query}`);
}
