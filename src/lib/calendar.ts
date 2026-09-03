import { SCHOOL_LEVEL_LABELS, type SchoolLevel } from "./catalog";

/**
 * Calendar hand-off for a confirmed booking, in the two forms that between
 * them cover everyone: a Google Calendar template URL, and an .ics file for
 * Apple Calendar, Outlook and anything else that speaks RFC 5545.
 *
 * Both are built from the stored Booking, and both emit times in UTC. Slot
 * times are stored as instants, so UTC is exact - and it sidesteps having to
 * ship a VTIMEZONE block for Europe/Amsterdam just to say the same thing.
 *
 * Structural input type, so this needs no database to test and doesn't care
 * which query loaded the booking.
 */
export type CalendarBooking = {
  reference: string;
  studentName: string;
  schoolLevel: SchoolLevel;
  year: string;
  subject: string;
  createdAt: Date;
  service: { name: string };
  slot: { startsAt: Date; endsAt: Date };
};

/**
 * Slots carry no location - there is one tutor and one calendar in this
 * prototype. A real schema would hang this off the slot or the tutor.
 */
const LOCATION = "MIQI Huiswerkbegeleiding, Amsterdam";

/** UID needs to be globally unique and stable; the reference already is. */
const UID_DOMAIN = "miqi.example";

function summaryFor(booking: CalendarBooking): string {
  return `${booking.service.name} - ${booking.subject}`;
}

function descriptionFor(booking: CalendarBooking): string {
  return [
    `${booking.subject} for ${booking.studentName}`,
    `${SCHOOL_LEVEL_LABELS[booking.schoolLevel]}, ${booking.year}`,
    `Booking reference: ${booking.reference}`,
  ].join("\n");
}

/** The `YYYYMMDDTHHMMSSZ` form both Google and RFC 5545 accept. */
function utcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function googleCalendarUrl(booking: CalendarBooking): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summaryFor(booking),
    dates: `${utcStamp(booking.slot.startsAt)}/${utcStamp(booking.slot.endsAt)}`,
    details: descriptionFor(booking),
    location: LOCATION,
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * RFC 5545 §3.3.11: backslashes, semicolons and commas are delimiters inside
 * a property value, and newlines have to travel as a literal `\n`.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

const MAX_OCTETS = 75;

/**
 * RFC 5545 §3.1: no line may exceed 75 octets, and continuations start with a
 * single space. The limit is octets rather than characters, which matters as
 * soon as a Dutch name brings a multi-byte character with it - so this counts
 * UTF-8 bytes and iterates by code point, never splitting one in half.
 */
function foldLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= MAX_OCTETS) return line;

  const parts: string[] = [];
  let current = "";
  let octets = 0;
  // The leading space on a continuation counts toward its 75.
  let limit = MAX_OCTETS;

  for (const char of line) {
    const size = Buffer.byteLength(char, "utf8");
    if (octets + size > limit) {
      parts.push(current);
      current = "";
      octets = 0;
      limit = MAX_OCTETS - 1;
    }
    current += char;
    octets += size;
  }
  parts.push(current);

  return parts.join("\r\n ");
}

export function bookingIcs(booking: CalendarBooking): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MIQI Huiswerkbegeleiding//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${booking.reference}@${UID_DOMAIN}`,
    // DTSTAMP is when the record was made, not when the file was served, so
    // the same booking always produces a byte-identical file.
    `DTSTAMP:${utcStamp(booking.createdAt)}`,
    `DTSTART:${utcStamp(booking.slot.startsAt)}`,
    `DTEND:${utcStamp(booking.slot.endsAt)}`,
    `SUMMARY:${escapeText(summaryFor(booking))}`,
    `DESCRIPTION:${escapeText(descriptionFor(booking))}`,
    `LOCATION:${escapeText(LOCATION)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // CRLF throughout, including a trailing one - some parsers are strict.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
