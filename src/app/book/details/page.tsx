import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailsForm } from "@/components/DetailsForm";
import { StepUnavailable } from "@/components/StepUnavailable";
import { Stepper } from "@/components/Stepper";
import { slotsHref } from "@/lib/booking";
import { formatDateTime, formatPrice } from "@/lib/format";
import { resolveFunnelStep } from "@/lib/funnel";

const TITLE = "Your details";

export default async function DetailsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const step = await resolveFunnelStep(await searchParams);

  if (step.status === "invalid") notFound();
  if (step.status === "unavailable") {
    return (
      <StepUnavailable
        step={4}
        title={TITLE}
        reason={step.reason}
        backHref={slotsHref(step.selection)}
      />
    );
  }

  const { selection, service, slot, priceCents, details } = step;

  return (
    <div>
      <Stepper current={4} />
      <h1 className="text-xl font-semibold tracking-tight">{TITLE}</h1>
      <p className="mt-2 text-sm text-muted">
        {service.name} · {selection.year} · {selection.subject} ·{" "}
        {formatDateTime(slot.startsAt)} —{" "}
        <span className="text-ink">{formatPrice(priceCents)}</span>
      </p>

      <DetailsForm selection={selection} defaults={details} />

      <Link
        href={slotsHref(selection)}
        className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
      >
        Back
      </Link>
    </div>
  );
}
