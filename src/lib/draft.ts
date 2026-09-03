import { cookies } from "next/headers";
import { detailsSchema, type BookingDetails } from "./validation";

/**
 * The parent's contact details, parked between the details form and the review
 * page.
 *
 * The rest of the funnel keeps its state in the URL, which is deliberate - it
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

/**
 * The cookie is client-supplied like anything else, so it goes through the
 * same schema as the form. A tampered or stale draft is treated as no draft:
 * the parent is sent back to the form rather than shown an error page.
 */
export async function readDetailsDraft(): Promise<BookingDetails | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;

  try {
    const result = detailsSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
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

/**
 * Dropped as soon as the booking exists, so the contact details don't outlive
 * the funnel that needed them - from then on the Booking row is the record.
 */
export async function clearDetailsDraft(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/book" });
}
