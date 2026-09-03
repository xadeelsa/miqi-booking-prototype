import { SCHOOL_LEVEL_LABELS, type SchoolLevel } from "./catalog";

/**
 * Google Calendar URL and .ics file for a confirmed booking. Times are emitted
 * in UTC, which avoids shipping a VTIMEZONE block for Europe/Amsterdam.
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

/** RFC 5545 §3.3.11: escape the delimiters, and send newlines as a literal. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

const MAX_OCTETS = 75;

/**
 * RFC 5545 §3.1: fold at 75 octets, not characters, so this counts UTF-8 bytes
 * and iterates by code point. Continuations start with a single space.
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
    // Booking time, not serve time, so the file is byte-identical every time.
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

  // CRLF throughout, including a trailing one. Some parsers are strict.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
