import Link from "next/link";
import { Stepper } from "@/components/Stepper";
import { Note } from "@/components/ui/Note";
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
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <Note className="mt-6">{UNAVAILABLE_MESSAGES[reason]}</Note>
      <Link
        href={backHref}
        className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
      >
        Choose another time
      </Link>
    </div>
  );
}
