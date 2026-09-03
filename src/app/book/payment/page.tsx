import { notFound, redirect } from "next/navigation";
import { PaymentForm } from "@/components/PaymentForm";
import { StepUnavailable } from "@/components/StepUnavailable";
import { Stepper } from "@/components/Stepper";
import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { Note } from "@/components/ui/Note";
import { PageHeader } from "@/components/ui/PageHeader";
import { detailsHref, reviewHref, slotsHref } from "@/lib/booking";
import { formatDateTime, formatPrice } from "@/lib/format";
import { resolveFunnelStep } from "@/lib/funnel";
import { payAndBook } from "./actions";

const TITLE = "Payment";

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const step = await resolveFunnelStep(await searchParams);

  if (step.status === "invalid") notFound();
  if (step.status === "unavailable") {
    return (
      <StepUnavailable
        step={6}
        title={TITLE}
        reason={step.reason}
        backHref={slotsHref(step.selection)}
      />
    );
  }

  const { selection, service, slot, priceCents, details } = step;
  if (!details) redirect(detailsHref(selection));

  return (
    <div>
      <Stepper current={6} />
      <PageHeader title={TITLE}>
        {service.name} · {formatDateTime(slot.startsAt)} for{" "}
        {details.studentName}
      </PageHeader>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="h-1 bg-accent" aria-hidden />
        <div className="flex items-baseline justify-between px-5 py-5 sm:px-6">
          <span className="text-sm text-muted">Amount due</span>
          <span className="text-xl font-semibold text-brand">
            {formatPrice(priceCents)}
          </span>
        </div>
      </Card>

      <Note className="mt-4">
        No payment provider is connected in this prototype. Both outcomes below
        are simulated so the decline path can be demonstrated on demand — your
        booking is only created if the payment succeeds.
      </Note>

      <PaymentForm
        action={payAndBook.bind(null, selection)}
        priceCents={priceCents}
      />

      <BackLink href={reviewHref(selection)}>Back to review</BackLink>
    </div>
  );
}
