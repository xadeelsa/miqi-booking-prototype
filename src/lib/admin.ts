import { getBookingsForAdmin } from "./queries";

type AdminBooking = Awaited<ReturnType<typeof getBookingsForAdmin>>[number];

export type AdminOverview = {
  total: number;
  upcoming: AdminBooking[];
  past: AdminBooking[];
  revenueCents: number;
};

/**
 * Splits the booking list around `now`, read once so a session starting this
 * instant lands in exactly one half.
 */
export async function loadAdminOverview(
  now: Date = new Date(),
): Promise<AdminOverview> {
  const bookings = await getBookingsForAdmin();
  return summariseBookings(bookings, now);
}

export function summariseBookings(
  bookings: AdminBooking[],
  now: Date,
): AdminOverview {
  const instant = now.getTime();

  return {
    total: bookings.length,
    upcoming: bookings.filter((b) => b.slot.startsAt.getTime() >= instant),
    // The query orders ascending, which the past list wants reversed.
    past: bookings
      .filter((b) => b.slot.startsAt.getTime() < instant)
      .reverse(),
    revenueCents: bookings.reduce((total, b) => total + b.priceCents, 0),
  };
}
