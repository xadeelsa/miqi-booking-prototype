import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Stepper } from "@/components/Stepper";
import { Card } from "@/components/ui/Card";
import { Note } from "@/components/ui/Note";
import {
  loadBookingContext,
  selectionQuery,
  slotsHref,
  UNAVAILABLE_MESSAGES,
  type BookingSelection,
} from "@/lib/booking";
import {
  isValidLevel,
  isValidSubject,
  isValidYear,
  SCHOOL_LEVEL_LABELS,
} from "@/lib/catalog";
import { readDetailsDraft } from "@/lib/draft";
import { formatDateTime, formatPrice } from "@/lib/format";

type Params = {
  service?: string;
  level?: string;
  year?: string;
  subject?: string;
  slot?: string;
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { service, level, year, subject, slot } = await searchParams;

  if (!service || !level || !year || !subject || !slot) notFound();
  if (!isValidLevel(level)) notFound();
  if (!isValidYear(level, year)) notFound();
  if (!isValidSubject(level, subject)) notFound();

  const slotId = Number(slot);
  if (!Number.isSafeInteger(slotId) || slotId < 1) notFound();

  const selection: BookingSelection = {
    service,
    level,
    year,
    subject,
    slot: slotId,
  };
  const context = await loadBookingContext(selection);

  if (!context.ok) {
    return (
      <div>
        <Stepper current={5} />
        <h1 className="text-xl font-semibold tracking-tight">
          Review your booking
        </h1>
        <Note className="mt-6">{UNAVAILABLE_MESSAGES[context.reason]}</Note>
        <Link
          href={slotsHref(selection)}
          className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
        >
          Choose another time
        </Link>
      </div>
    );
  }

  const detailsHref = `/book/details?${selectionQuery(selection)}`;

  // Landing here without a draft means a direct link or an expired cookie —
  // send the parent to the form rather than showing half a summary.
  const details = await readDetailsDraft();
  if (!details) redirect(detailsHref);

  return (
    <div>
      <Stepper current={5} />
      <h1 className="text-xl font-semibold tracking-tight">
        Review your booking
      </h1>
      <p className="mt-2 text-sm text-muted">
        Please check everything before you pay.
      </p>

      <Card className="mt-6">
        <dl className="divide-y divide-line text-sm">
          <Row label="Service" value={context.service.name} />
          <Row label="Level" value={SCHOOL_LEVEL_LABELS[level]} />
          <Row label="Year" value={year} />
          <Row label="Subject" value={subject} />
          <Row label="Time" value={formatDateTime(context.slot.startsAt)} />
          <Row label="Parent / guardian" value={details.parentName} />
          <Row label="Student" value={details.studentName} />
          <Row label="Email" value={details.parentEmail} />
          {details.parentPhone && (
            <Row label="Phone" value={details.parentPhone} />
          )}
          <Row
            label="Total"
            value={
              <span className="font-semibold text-brand">
                {formatPrice(context.priceCents)}
              </span>
            }
          />
        </dl>
      </Card>

      <Note className="mt-6">
        This time is held for nobody until payment succeeds — the booking is
        created at the payment step.
      </Note>

      <div className="mt-6 flex gap-4 text-sm">
        <Link href={detailsHref} className="text-muted underline hover:text-ink">
          Edit details
        </Link>
        <Link
          href={slotsHref(selection)}
          className="text-muted underline hover:text-ink"
        >
          Change time
        </Link>
      </div>
    </div>
  );
}
