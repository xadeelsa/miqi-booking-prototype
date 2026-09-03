import Link from "next/link";
import { notFound } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { getAvailableSlots, getServiceBySlug } from "@/lib/queries";
import { dayKey, formatDayLong, formatPrice, formatTime } from "@/lib/format";
import { isValidLevel, isValidSubject, isValidYear } from "@/lib/catalog";

type Params = {
  service?: string;
  level?: string;
  year?: string;
  subject?: string;
};

export default async function ChooseSlotPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { service: slug, level, year, subject } = await searchParams;

  // Server-side validation of every incoming parameter. The dropdowns on the
  // previous step are UX only — this is the gate.
  if (!slug || !level || !year || !subject) notFound();
  if (!isValidLevel(level)) notFound();
  if (!isValidYear(level, year)) notFound();
  if (!isValidSubject(level, subject)) notFound();

  const service = await getServiceBySlug(slug);
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
      <h1 className="text-xl font-semibold tracking-tight">Choose a time</h1>
      <p className="mt-2 text-sm text-muted">
        {service.name} · {year} · {subject} —{" "}
        <span className="text-ink">{formatPrice(service.priceCents)}</span>
      </p>

      {byDay.size === 0 ? (
        <p className="mt-6 rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          There are no available times at the moment.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {[...byDay.entries()].map(([key, daySlots]) => (
            <section
              key={key}
              className="rounded-xl border border-line bg-surface p-5"
            >
              <h2 className="text-sm font-medium capitalize">
                {formatDayLong(daySlots[0].startsAt)}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <li key={slot.id}>
                    <Link
                      href={`/book/details?${query.toString()}&slot=${slot.id}`}
                      className="inline-flex rounded-lg border border-line px-3 py-2 text-sm transition hover:border-brand hover:text-brand"
                    >
                      {formatTime(slot.startsAt)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link
        href={`/book/level?service=${encodeURIComponent(service.slug)}`}
        className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
      >
        Back
      </Link>
    </div>
  );
}
