import { notFound } from "next/navigation";
import { DetailsForm } from "@/components/DetailsForm";
import { StepUnavailable } from "@/components/StepUnavailable";
import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
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
        title={TITLE}
        reason={step.reason}
        backHref={slotsHref(step.selection)}
      />
    );
  }

  const { selection, service, slot, priceCents, details } = step;

  return (
    <div>
      <PageHeader title={TITLE}>
        {service.name} · {selection.year} · {selection.subject} ·{" "}
        {formatDateTime(slot.startsAt)} -{" "}
        <span className="text-ink">{formatPrice(priceCents)}</span>
      </PageHeader>

      <Card className="mt-6">
        <DetailsForm selection={selection} defaults={details} />
      </Card>

      <BackLink href={slotsHref(selection)}>Back</BackLink>
    </div>
  );
}
