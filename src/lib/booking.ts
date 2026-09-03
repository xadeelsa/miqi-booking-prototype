import { Prisma } from "@prisma/client";
import { db } from "./db";
import { getServiceBySlug, getSlotById } from "./queries";
import { bookingReference } from "./reference";
import type { BookingInput, BookingSelection } from "./validation";

export type UnavailableReason = "service" | "slot" | "taken" | "past";

export const UNAVAILABLE_MESSAGES: Record<UnavailableReason, string> = {
  service: "That service is no longer offered.",
  slot: "That time is no longer in our schedule.",
  taken: "Sorry, someone else just booked that time.",
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
 * Resolves a selection into the real records and prices it from the Service
 * row. The price never travels through the funnel, so it cannot be edited.
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

  return { ok: true, service, slot, priceCents: service.priceCents };
}

export type CreateBookingResult =
  | { ok: true; reference: string; priceCents: number }
  | { ok: false; reason: UnavailableReason };

/** How many fresh references to try before giving up. */
const REFERENCE_ATTEMPTS = 5;

/** Writes the Booking. Call this after payment has succeeded, not before. */
export async function createBooking(
  input: BookingInput,
): Promise<CreateBookingResult> {
  const context = await loadBookingContext(input);
  if (!context.ok) return { ok: false, reason: context.reason };

  for (let attempt = 1; attempt <= REFERENCE_ATTEMPTS; attempt += 1) {
    try {
      const booking = await db.booking.create({
        data: {
          reference: bookingReference(),
          slotId: context.slot.id,
          serviceId: context.service.id,
          schoolLevel: input.level,
          year: input.year,
          subject: input.subject,
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          parentPhone: input.parentPhone,
          studentName: input.studentName,
          // Priced from the Service row, never from the request.
          priceCents: context.priceCents,
          paymentStatus: "PAID",
        },
        select: { reference: true, priceCents: true },
      });

      return {
        ok: true,
        reference: booking.reference,
        priceCents: booking.priceCents,
      };
    } catch (error) {
      switch (uniqueConflictField(error)) {
        // Another parent's insert committed first.
        case "slotId":
          return { ok: false, reason: "taken" };

        // Reference collision, not a booking problem. Retry with a new code.
        case "reference":
          continue;

        default:
          throw error;
      }
    }
  }

  throw new Error(
    `Could not find an unused booking reference in ${REFERENCE_ATTEMPTS} attempts.`,
  );
}

/** The field behind a unique-constraint violation, or null for other errors. */
function uniqueConflictField(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code !== "P2002") return null;

  const target = error.meta?.target;
  return Array.isArray(target) && target.length > 0 ? String(target[0]) : null;
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

export function slotsHref(selection: BookingSelection): string {
  const { service, level, year, subject } = selection;
  return `/book/slots?${new URLSearchParams({ service, level, year, subject })}`;
}

export function detailsHref(selection: BookingSelection): string {
  return `/book/details?${selectionQuery(selection)}`;
}

export function reviewHref(selection: BookingSelection): string {
  return `/book/review?${selectionQuery(selection)}`;
}

export function paymentHref(selection: BookingSelection): string {
  return `/book/payment?${selectionQuery(selection)}`;
}

/** Keyed by reference, which is what the parent has in their email. */
export function confirmationHref(reference: string): string {
  return `/book/confirmation/${encodeURIComponent(reference)}`;
}

export function icsHref(reference: string): string {
  return `${confirmationHref(reference)}/calendar.ics`;
}
