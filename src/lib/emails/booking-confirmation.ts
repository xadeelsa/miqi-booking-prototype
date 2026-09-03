import { SCHOOL_LEVEL_LABELS, type SchoolLevel } from "../catalog";
import { EMAIL_FROM, type SendEmailRequest } from "../email";
import { formatDateTime, formatPrice } from "../format";

/**
 * Built from the stored Booking rather than from the funnel's state, so what
 * a parent is told matches what was actually recorded — including the price,
 * which is the snapshot taken at booking time.
 *
 * Structural type rather than Prisma's, so this stays testable without a
 * database and doesn't care which query loaded the booking.
 */
export type ConfirmationBooking = {
  reference: string;
  parentName: string;
  parentEmail: string;
  studentName: string;
  schoolLevel: SchoolLevel;
  year: string;
  subject: string;
  priceCents: number;
  service: { name: string };
  slot: { startsAt: Date };
};

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

  const lines = [
    `Hello ${booking.parentName},`,
    "",
    `${booking.studentName}'s session is booked.`,
    "",
    `Reference: ${booking.reference}`,
    `Service:   ${booking.service.name}`,
    `For:       ${level}, ${booking.year} — ${booking.subject}`,
    `When:      ${when}`,
    `Paid:      ${price}`,
    "",
    "Need to change or cancel? Reply to this email with your reference.",
    "",
    "MIQI Huiswerkbegeleiding",
  ];

  return {
    from: EMAIL_FROM,
    to: [booking.parentEmail],
    subject: `Booking confirmed — ${booking.reference}`,
    text: lines.join("\n"),
    html: `
      <div style="font-family:system-ui,sans-serif;color:#2f3337;line-height:1.5">
        <p>Hello ${parentName},</p>
        <p><strong>${studentName}&rsquo;s session is booked.</strong></p>
        <table cellpadding="0" cellspacing="0" style="font-size:14px">
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">Reference</td><td><strong>${booking.reference}</strong></td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">Service</td><td>${serviceName}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">For</td><td>${level}, ${booking.year} &mdash; ${subject}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">When</td><td>${when}</td></tr>
          <tr><td style="padding:2px 16px 2px 0;color:#5f6a70">Paid</td><td>${price}</td></tr>
        </table>
        <p style="color:#5f6a70;font-size:14px">
          Need to change or cancel? Reply to this email with your reference.
        </p>
        <p style="color:#5f6a70;font-size:14px">MIQI Huiswerkbegeleiding</p>
      </div>
    `.trim(),
  };
}
