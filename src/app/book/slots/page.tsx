import Link from "next/link";
import { notFound } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { Note } from "@/components/ui/Note";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAvailableSlots, getServiceBySlug } from "@/lib/queries";
import { dayKey, formatDayLong, formatPrice, formatTime } from "@/lib/format";
import { parseSelection } from "@/lib/validation";

export default async function ChooseSlotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Server-side validation of every incoming parameter. The dropdowns on the
  // previous step are UX only — this is the gate.
  const selection = parseSelection(await searchParams);
  if (!selection) notFound();

  const { level, year, subject } = selection;

  const service = await getServiceBySlug(selection.service);
  if (!service) notFound();

  const slots = await getAvailableSlots();

  // Group slots into days for a readable calendar-style list.
  const byDay = new Map<string, typeof slots>();
  for (const slot of slots) {
    const key = dayKey(slot.startsAt);
    const bucket = byDay.get(key);
    if (bucket) bucket.push(slot);
    else byDay.set(key, [slot]);
  }

  const query = new URLSearchParams({
    service: service.slug,
    level,
    year,
    subject,
  });

  return (
    <div>
      <Stepper current={3} />
      <PageHeader title="Choose a time">
        {service.name} · {year} · {subject} —{" "}
        <span className="text-ink">{formatPrice(service.priceCents)}</span>
      </PageHeader>

      {byDay.size === 0 ? (
        <Note className="mt-6">There are no available times at the moment.</Note>
      ) : (
        <div className="mt-6 space-y-4">
          {[...byDay.entries()].map(([key, daySlots]) => (
            <Card key={key} className="p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold capitalize">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-accent"
                />
                {formatDayLong(daySlots[0].startsAt)}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <li key={slot.id}>
                    <Link
                      href={`/book/details?${query.toString()}&slot=${slot.id}`}
                      className="inline-flex min-w-[4.75rem] items-center justify-center rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-medium tabular-nums transition hover:border-brand hover:bg-surface hover:text-brand"
                    >
                      {formatTime(slot.startsAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      <BackLink href={`/book/level?service=${encodeURIComponent(service.slug)}`}>
        Back
      </BackLink>
    </div>
  );
}
