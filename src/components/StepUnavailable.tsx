import { BackLink } from "@/components/ui/BackLink";
import { Note } from "@/components/ui/Note";
import { PageHeader } from "@/components/ui/PageHeader";
import { UNAVAILABLE_MESSAGES, type UnavailableReason } from "@/lib/booking";

/**
 * Shown when the chosen slot or service stopped being bookable. Not an error
 * page: the funnel is intact, one choice expired.
 */
export function StepUnavailable({
  title,
  reason,
  backHref,
}: {
  title: string;
  reason: UnavailableReason;
  backHref: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <Note className="mt-6 bg-accent-tint text-ink">
        {UNAVAILABLE_MESSAGES[reason]}
      </Note>
      <BackLink href={backHref}>Choose another time</BackLink>
    </div>
  );
}
