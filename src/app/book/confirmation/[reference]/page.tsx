import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Note } from "@/components/ui/Note";
import { icsHref } from "@/lib/booking";
import { googleCalendarUrl } from "@/lib/calendar";
import { SCHOOL_LEVEL_LABELS } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getBookingByReference } from "@/lib/queries";
import { parseReference } from "@/lib/validation";

/** The reference acts as a bearer token here. See README limitations. */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const reference = parseReference((await params).reference);
  if (!reference) notFound();

  const booking = await getBookingByReference(reference);
  if (!booking) notFound();

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="h-1.5 bg-accent" aria-hidden />
        <div className="p-8 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">
            Booking confirmed
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            See you on {formatDateTime(booking.slot.startsAt)}
          </h1>
          <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
            We&apos;ve emailed a confirmation to {booking.parentEmail}. Keep
            your reference handy if you need to get in touch.
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <dl className="divide-y divide-line text-sm">
          <Row
            label="Reference"
            value={
              <span className="font-semibold tracking-wide text-brand">
                {booking.reference}
              </span>
            }
          />
          <Row label="Service" value={booking.service.name} />
          <Row
            label="Level"
            value={SCHOOL_LEVEL_LABELS[booking.schoolLevel]}
          />
          <Row label="Year" value={booking.year} />
          <Row label="Subject" value={booking.subject} />
          <Row label="Time" value={formatDateTime(booking.slot.startsAt)} />
          <Row label="Student" value={booking.studentName} />
          <Row label="Parent / guardian" value={booking.parentName} />
          <Row
            label="Paid"
            value={
              <span className="text-base font-semibold text-brand">
                {formatPrice(booking.priceCents)}
              </span>
            }
          />
        </dl>
      </Card>

      <section className="mt-6">
        <h2 className="text-sm font-semibold tracking-tight">
          Add it to your calendar
        </h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={googleCalendarUrl(booking)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary")}
          >
            Add to Google Calendar
          </a>
          <a
            href={icsHref(booking.reference)}
            download={`${booking.reference}.ics`}
            className={buttonClass("secondary")}
          >
            Download .ics (Apple Calendar, Outlook)
          </a>
        </div>
      </section>

      <Note className="mt-6">
        This is a prototype: no money has moved and no email has actually been
        delivered.
      </Note>

      <Link href="/book" className={buttonClass("primary", "mt-6")}>
        Book another session
      </Link>
    </div>
  );
}
