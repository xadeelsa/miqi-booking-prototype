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

/** Future slots with no booking attached. */
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

/** Every booking, soonest session first. Unbounded, see README limitations. */
export function getBookingsForAdmin() {
  return db.booking.findMany({
    include: { service: true, slot: true },
    orderBy: { slot: { startsAt: "asc" } },
  });
}
