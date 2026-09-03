import { db } from "./db";

export function getActiveServices() {
  return db.service.findMany({
    where: { active: true },
    orderBy: { priceCents: "asc" },
  });
}

export function getServiceBySlug(slug: string) {
  return db.service.findFirst({ where: { slug, active: true } });
}

/**
 * Availability = slots in the future that have no booking attached.
 *
 * Because Booking.slotId is UNIQUE, "has a booking" is a strict yes/no —
 * there is no partially-booked state to reason about.
 */
export function getAvailableSlots() {
  return db.slot.findMany({
    where: {
      booking: { is: null },
      startsAt: { gt: new Date() },
    },
    orderBy: { startsAt: "asc" },
  });
}

export function getSlotById(id: number) {
  return db.slot.findUnique({ where: { id }, include: { booking: true } });
}

/** Everything the confirmation page shows, in one round trip. */
export function getBookingByReference(reference: string) {
  return db.booking.findUnique({
    where: { reference },
    include: { service: true, slot: true },
  });
}

/**
 * Every booking, soonest session first, for the admin list.
 *
 * Deliberately unbounded: a prototype's whole dataset is a screenful, and
 * pretending otherwise would mean pagination nobody can exercise. The point
 * at which this needs a cursor and a SQL-side total is the point at which it
 * needs a date filter and a search box too.
 */
export function getBookingsForAdmin() {
  return db.booking.findMany({
    include: { service: true, slot: true },
    orderBy: { slot: { startsAt: "asc" } },
  });
}
