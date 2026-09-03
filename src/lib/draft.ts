import { cookies } from "next/headers";

/**
 * The parent's contact details, parked between the details form and the review
 * page.
 *
 * The rest of the funnel keeps its state in the URL, which is deliberate — it
 * makes every step shareable, refreshable and server-rendered with no client
 * state to hydrate. Contact details are the one thing that must not live
 * there: a name, an email and a phone number in a query string end up in
 * browser history, in `Referer` headers and in access logs.
 *
 * So they go in a short-lived httpOnly cookie instead. The review page stays a
 * plain Server Component, and the details never reach client JavaScript.
 */

const COOKIE = "miqi_booking_details";
const MAX_AGE_SECONDS = 60 * 30;

export type BookingDetails = {
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  studentName: string;
};

function isBookingDetails(value: unknown): value is BookingDetails {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft.parentName === "string" &&
    typeof draft.parentEmail === "string" &&
    typeof draft.studentName === "string" &&
    (draft.parentPhone === undefined || typeof draft.parentPhone === "string")
  );
}

export async function readDetailsDraft(): Promise<BookingDetails | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isBookingDetails(parsed) ? parsed : null;
  } catch {
    // A malformed cookie is indistinguishable from no cookie: the parent gets
    // sent back to the form rather than an error page.
    return null;
  }
}

export async function saveDetailsDraft(details: BookingDetails): Promise<void> {
  (await cookies()).set(COOKIE, JSON.stringify(details), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/book",
    maxAge: MAX_AGE_SECONDS,
  });
}
