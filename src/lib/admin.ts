import { getBookingsForAdmin } from "./queries";

type AdminBooking = Awaited<ReturnType<typeof getBookingsForAdmin>>[number];

export type AdminOverview = {
  total: number;
  upcoming: AdminBooking[];
  past: AdminBooking[];
  revenueCents: number;
};

/**
 * Splits the booking list around "now" and totals it.
 *
 * `now` is injectable for that reason. One clock read, so both halves are
 * measured against the same instant and a session starting this second can't
 * land in neither list.
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
    // Reversed so the most recent session is first. The query orders
    // ascending, which is what the upcoming list wants and the past one
    // doesn't.
    past: bookings
      .filter((b) => b.slot.startsAt.getTime() < instant)
      .reverse(),
    revenueCents: bookings.reduce((total, b) => total + b.priceCents, 0),
  };
}
