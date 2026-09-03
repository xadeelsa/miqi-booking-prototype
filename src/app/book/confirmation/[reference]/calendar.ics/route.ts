import { bookingIcs } from "@/lib/calendar";
import { getBookingByReference } from "@/lib/queries";
import { parseReference } from "@/lib/validation";

/**
 * The .ics download, served from a child segment of the confirmation page so
 * the same reference gates both.
 *
 * Plain 404 responses rather than `notFound()`: this is a file endpoint, and a
 * download that fails should say so in the status code instead of returning an
 * HTML error page with a 404 attached. A malformed reference gets the same
 * answer as an unknown one, so the URL can't be used to probe which codes
 * exist.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> },
) {
  const reference = parseReference((await params).reference);
  const booking = reference ? await getBookingByReference(reference) : null;

  if (!booking) {
    return new Response("Booking not found.\n", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(bookingIcs(booking), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      // The reference is already prefixed, so the file lands as MIQI-XXXXX.ics.
      "Content-Disposition": `attachment; filename="${booking.reference}.ics"`,
      // Contains personal data and is trivially cheap to regenerate.
      "Cache-Control": "private, no-store",
    },
  });
}
