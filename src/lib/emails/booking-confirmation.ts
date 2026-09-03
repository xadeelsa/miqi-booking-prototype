import { icsHref } from "../booking";
import { googleCalendarUrl, type CalendarBooking } from "../calendar";
import { SCHOOL_LEVEL_LABELS } from "../catalog";
import { EMAIL_FROM, type SendEmailRequest } from "../email";
import { formatDateTime, formatPrice } from "../format";

/**
 * Built from the stored Booking rather than from the funnel's state, so what
 * a parent is told matches what was actually recorded - including the price,
 * which is the snapshot taken at booking time.
 *
 * Structural type rather than Prisma's, so this stays testable without a
 * database and doesn't care which query loaded the booking. It extends the
 * calendar's shape because the email carries the same two hand-off links.
 */
export type ConfirmationBooking = CalendarBooking & {
  parentName: string;
  parentEmail: string;
  priceCents: number;
};

/**
 * Emails can't use relative URLs. Defaults to the dev server so the logged
 * message is clickable without any configuration.
 */
const APP_URL = (process.env.APP_URL ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/**
 * Names and subjects are parent-supplied, and the HTML body is assembled by
 * hand rather than by JSX, so nothing escapes them for us.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function bookingConfirmationEmail(
  booking: ConfirmationBooking,
): SendEmailRequest {
  const when = formatDateTime(booking.slot.startsAt);
  const price = formatPrice(booking.priceCents);
  const level = SCHOOL_LEVEL_LABELS[booking.schoolLevel];
  const parentName = escapeHtml(booking.parentName);
  const studentName = escapeHtml(booking.studentName);
  const subject = escapeHtml(booking.subject);
  const serviceName = escapeHtml(booking.service.name);
  const googleUrl = googleCalendarUrl(booking);
  const icsUrl = `${APP_URL}${icsHref(booking.reference)}`;

  const lines = [
    `Hello ${booking.parentName},`,
    "",
    `${booking.studentName}'s session is booked.`,
    "",
    `Reference: ${booking.reference}`,
    `Service:   ${booking.service.name}`,
    `For:       ${level}, ${booking.year}, ${booking.subject}`,
    `When:      ${when}`,
    `Paid:      ${price}`,
    "",
    "Add it to your calendar:",
    `  Google Calendar: ${googleUrl}`,
    `  Apple Calendar / Outlook (.ics): ${icsUrl}`,
    "",
    "Need to change or cancel? Reply to this email with your reference.",
    "",
    "MIQI Huiswerkbegeleiding",
  ];

  return {
    from: EMAIL_FROM,
    to: [booking.parentEmail],
    subject: `Booking confirmed - ${booking.reference}`,
    text: lines.join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;color:#2f3337;line-height:1.5">
        <p>Hello ${parentName},</p>
        <p><strong>${studentName}&rsquo;s session is booked.</strong></p>
        <table cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">Reference</td><td><strong>${booking.reference}</strong></td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">Service</td><td>${serviceName}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">For</td><td>${level}, ${booking.year}, ${subject}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">When</td><td>${when}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">Paid</td><td>${price}</td></tr>
        </table>
        <p style="font-size:14px">
          Add it to your calendar:
          <a href="${escapeHtml(googleUrl)}">Google Calendar</a>
          &middot;
          <a href="${escapeHtml(icsUrl)}">Apple Calendar / Outlook (.ics)</a>
        </p>
        <p style="color:#5f6a70;font-size:14px">
          Need to change or cancel? Reply to this email with your reference.
        </p>
        <p style="color:#5f6a70;font-size:14px">MIQI Huiswerkbegeleiding</p>
      </div>
    `.trim(),
  };
}
