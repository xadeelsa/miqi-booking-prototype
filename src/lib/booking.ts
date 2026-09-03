import type { SchoolLevel } from "./catalog";
import { getServiceBySlug, getSlotById } from "./queries";

/**
 * Everything the parent picked in steps 1–3, carried in the URL. Every value
 * here arrives from the client, so it is untrusted until it has been resolved
 * against the database by `loadBookingContext`.
 */
export type BookingSelection = {
  service: string;
  level: SchoolLevel;
  year: string;
  subject: string;
  slot: number;
};

export type UnavailableReason = "service" | "slot" | "taken" | "past";

export const UNAVAILABLE_MESSAGES: Record<UnavailableReason, string> = {
  service: "That service is no longer offered.",
  slot: "That time is no longer in our schedule.",
  taken: "Sorry — someone else just booked that time.",
  past: "That time has already passed.",
};

export type BookingContext =
  | {
      ok: true;
      service: { id: number; slug: string; name: string };
      slot: { id: number; startsAt: Date; endsAt: Date };
      priceCents: number;
    }
  | { ok: false; reason: UnavailableReason };

/**
 * Resolves a selection into the real records and prices it.
 *
 * The price is deliberately *not* carried through the funnel. The URL never
 * holds an amount, so there is nothing for a parent to edit, and the details
 * page, the review page and the booking write all price through this one
 * function — what is shown and what is charged cannot drift apart.
 *
 * Availability is re-checked on every call rather than once at slot selection,
 * because a parent can sit on the details form for a while. This narrows the
 * race window but does not close it; that is the database's job (M4).
 */
export async function loadBookingContext(
  selection: BookingSelection,
): Promise<BookingContext> {
  const [service, slot] = await Promise.all([
    getServiceBySlug(selection.service),
    getSlotById(selection.slot),
  ]);

  if (!service) return { ok: false, reason: "service" };
  if (!slot) return { ok: false, reason: "slot" };
  if (slot.booking) return { ok: false, reason: "taken" };
  if (slot.startsAt.getTime() <= Date.now()) return { ok: false, reason: "past" };

  // One session at the service's list price. Real pricing would vary by level
  // or bundle size; MIQI's prototype rate is flat per service.
  return { ok: true, service, slot, priceCents: service.priceCents };
}

/** Rebuilds the funnel's query string, so step links stay in one place. */
export function selectionQuery(selection: BookingSelection): string {
  return new URLSearchParams({
    service: selection.service,
    level: selection.level,
    year: selection.year,
    subject: selection.subject,
    slot: String(selection.slot),
  }).toString();
}

/** The step-3 URL, for "pick another time" links out of steps 4 and 5. */
export function slotsHref(selection: BookingSelection): string {
  const { service, level, year, subject } = selection;
  return `/book/slots?${new URLSearchParams({ service, level, year, subject })}`;
}
