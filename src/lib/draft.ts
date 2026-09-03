import { cookies } from "next/headers";
import { detailsSchema, type BookingDetails } from "./validation";

/**
 * The parent's contact details between the details form and payment. They go
 * in an httpOnly cookie rather than the URL, which would put a name, an email
 * and a phone number into browser history, `Referer` headers and access logs.
 */

const COOKIE = "miqi_booking_details";
const MAX_AGE_SECONDS = 60 * 30;

/** Client input like anything else, so it goes through the form's schema. */
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

/** Dropped once the booking exists and the row becomes the record. */
export async function clearDetailsDraft(): Promise<void> {
  (await cookies()).delete({ name: COOKIE, path: "/book" });
}
