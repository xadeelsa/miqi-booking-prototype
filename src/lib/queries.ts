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
