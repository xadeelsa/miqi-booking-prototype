// Display formatting. The UI is English, but MIQI operates in the Netherlands:
// prices are EUR and all times are anchored to Europe/Amsterdam regardless of
// the server's own timezone.

const LOCALE = "en-GB";
const TIME_ZONE = "Europe/Amsterdam";

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatDayLong(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return `${formatDayLong(date)} at ${formatTime(date)}`;
}

// Stable per-day key (in Amsterdam time) used to group slots into days.
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}
