import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PaymentForm } from "@/components/PaymentForm";
import { StepUnavailable } from "@/components/StepUnavailable";
import { Stepper } from "@/components/Stepper";
import { Card } from "@/components/ui/Card";
import { Note } from "@/components/ui/Note";
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
      <h1 className="text-xl font-semibold tracking-tight">{TITLE}</h1>
      <p className="mt-2 text-sm text-muted">
        {service.name} · {formatDateTime(slot.startsAt)} for{" "}
        {details.studentName}
      </p>

      <Card className="mt-6 flex items-baseline justify-between">
        <span className="text-sm text-muted">Amount due</span>
        <span className="text-lg font-semibold text-brand">
          {formatPrice(priceCents)}
        </span>
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

      <Link
        href={reviewHref(selection)}
        className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
      >
        Back to review
      </Link>
    </div>
  );
}
