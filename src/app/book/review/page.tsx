import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { StepUnavailable } from "@/components/StepUnavailable";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { detailsHref, paymentHref, slotsHref } from "@/lib/booking";
import { SCHOOL_LEVEL_LABELS } from "@/lib/catalog";
import { formatDateTime, formatPrice } from "@/lib/format";
import { resolveFunnelStep } from "@/lib/funnel";

const TITLE = "Review your booking";

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-6 py-3 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
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
        title={TITLE}
        reason={step.reason}
        backHref={slotsHref(step.selection)}
      />
    );
  }

  const { selection, service, slot, priceCents, details } = step;

  // No draft means a direct link or an expired cookie.
  if (!details) redirect(detailsHref(selection));

  return (
    <div>
      <PageHeader title={TITLE}>
        Please check everything before you pay.
      </PageHeader>

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
              <span className="text-base font-semibold text-brand">
                {formatPrice(priceCents)}
              </span>
            }
          />
        </dl>
      </Card>

      <Link
        href={paymentHref(selection)}
        className={buttonClass("primary", "mt-6")}
      >
        Continue to payment
      </Link>

      <div className="mt-6 flex gap-4 text-sm">
        <Link
          href={detailsHref(selection)}
          className="text-muted transition hover:text-brand"
        >
          Edit details
        </Link>
        <Link
          href={slotsHref(selection)}
          className="text-muted transition hover:text-brand"
        >
          Change time
        </Link>
      </div>
    </div>
  );
}
