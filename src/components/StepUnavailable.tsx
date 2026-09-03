import { Stepper } from "@/components/Stepper";
import { BackLink } from "@/components/ui/BackLink";
import { Note } from "@/components/ui/Note";
import { PageHeader } from "@/components/ui/PageHeader";
import { UNAVAILABLE_MESSAGES, type UnavailableReason } from "@/lib/booking";

/**
 * What every step shows when the chosen slot or service stopped being
 * bookable underneath the parent. Not an error page — the funnel is intact,
 * one specific choice just expired, so it keeps the stepper and offers the way
 * back rather than dead-ending.
 */
export function StepUnavailable({
  step,
  title,
  reason,
  backHref,
}: {
  step: number;
  title: string;
  reason: UnavailableReason;
  backHref: string;
}) {
  return (
    <div>
      <Stepper current={step} />
      <PageHeader title={title} />
      <Note className="mt-6 bg-accent-tint text-ink">
        {UNAVAILABLE_MESSAGES[reason]}
      </Note>
      <BackLink href={backHref}>Choose another time</BackLink>
    </div>
  );
}
