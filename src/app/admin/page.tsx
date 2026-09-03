import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Note } from "@/components/ui/Note";
import { loadAdminOverview } from "@/lib/admin";
import { confirmationHref } from "@/lib/booking";
import { SCHOOL_LEVEL_LABELS } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { getBookingsForAdmin } from "@/lib/queries";

// A stale booking list is worse than no booking list.
export const dynamic = "force-dynamic";

export const metadata = { title: "Bookings - MIQI admin" };

type AdminBooking = Awaited<ReturnType<typeof getBookingsForAdmin>>[number];

function BookingRow({ booking }: { booking: AdminBooking }) {
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-medium text-ink">
          {formatDateTime(booking.slot.startsAt)}
        </p>
        <Link
          href={confirmationHref(booking.reference)}
          className="font-semibold tracking-wide text-brand underline decoration-transparent transition hover:decoration-inherit"
        >
          {booking.reference}
        </Link>
      </div>

      <p className="mt-1 text-muted">
        {booking.service.name} · {SCHOOL_LEVEL_LABELS[booking.schoolLevel]},{" "}
        {booking.year} · {booking.subject} ·{" "}
        <span className="text-ink">{formatPrice(booking.priceCents)}</span>
      </p>

      <p className="mt-1 text-muted">
        {booking.studentName}, booked by {booking.parentName} (
        <a
          href={`mailto:${booking.parentEmail}`}
          className="underline hover:text-ink"
        >
          {booking.parentEmail}
        </a>
        {booking.parentPhone && `, ${booking.parentPhone}`})
      </p>
    </li>
  );
}

function Section({
  title,
  bookings,
}: {
  title: string;
  bookings: AdminBooking[];
}) {
  if (bookings.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold tracking-tight">
        {title}{" "}
        <span className="font-normal text-muted">({bookings.length})</span>
      </h2>
      <Card className="mt-3">
        <ul className="divide-y divide-line text-sm">
          {bookings.map((booking) => (
            <BookingRow key={booking.reference} booking={booking} />
          ))}
        </ul>
      </Card>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default async function AdminPage() {
  const { total, upcoming, past, revenueCents } = await loadAdminOverview();

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">Bookings</h1>
      <p className="mt-2 text-sm text-muted">
        Every booking in the system. Each one exists only because a payment
        succeeded.
      </p>

      <Note className="mt-6">
        This view is unauthenticated in the prototype. Anyone who knows the
        URL can read every parent&apos;s contact details. It is the first thing
        that would sit behind a login.
      </Note>

      <Card className="mt-6">
        <dl className="grid grid-cols-3 gap-4">
          <Stat label="Bookings" value={String(total)} />
          <Stat label="Upcoming" value={String(upcoming.length)} />
          <Stat label="Revenue" value={formatPrice(revenueCents)} />
        </dl>
      </Card>

      {total === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Nothing booked yet. Take the funnel for a spin and this fills up.
        </p>
      ) : (
        <>
          <Section title="Upcoming" bookings={upcoming} />
          <Section title="Past" bookings={past} />
        </>
      )}
    </div>
  );
}
