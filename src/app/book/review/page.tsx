import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { StepUnavailable } from "@/components/StepUnavailable";
import { Stepper } from "@/components/Stepper";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { detailsHref, paymentHref, slotsHref } from "@/lib/booking";
import { SCHOOL_LEVEL_LABELS } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { resolveFunnelStep } from "@/lib/funnel";

const TITLE = "Review your booking";

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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const step = await resolveFunnelStep(await searchParams);

  if (step.status === "invalid") notFound();
  if (step.status === "unavailable") {
    return (
      <StepUnavailable
        step={5}
        title={TITLE}
        reason={step.reason}
        backHref={slotsHref(step.selection)}
      />
    );
  }

  const { selection, service, slot, priceCents, details } = step;

  // No draft means a direct link or an expired cookie — send the parent to the
  // form rather than showing half a summary.
  if (!details) redirect(detailsHref(selection));

  return (
    <div>
      <Stepper current={5} />
      <h1 className="text-xl font-semibold tracking-tight">{TITLE}</h1>
      <p className="mt-2 text-sm text-muted">
        Please check everything before you pay.
      </p>

      <Card className="mt-6">
        <dl className="divide-y divide-line text-sm">
          <Row label="Service" value={service.name} />
          <Row label="Level" value={SCHOOL_LEVEL_LABELS[selection.level]} />
          <Row label="Year" value={selection.year} />
          <Row label="Subject" value={selection.subject} />
          <Row label="Time" value={formatDateTime(slot.startsAt)} />
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
                {formatPrice(priceCents)}
              </span>
            }
          />
        </dl>
      </Card>

      {/* Plain navigation: nothing is written until the payment succeeds, and
          the payment step re-validates everything on arrival anyway. */}
      <Link
        href={paymentHref(selection)}
        className={buttonClass("primary", "mt-6")}
      >
        Continue to payment
      </Link>

      <div className="mt-6 flex gap-4 text-sm">
        <Link
          href={detailsHref(selection)}
          className="text-muted underline hover:text-ink"
        >
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
