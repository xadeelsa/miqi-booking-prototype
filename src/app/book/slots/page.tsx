import { notFound } from "next/navigation";
import { SlotCalendar } from "@/components/SlotCalendar";
import { BackLink } from "@/components/ui/BackLink";
import { Note } from "@/components/ui/Note";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatPrice } from "@/lib/format";
import { getAvailableSlots, getServiceBySlug } from "@/lib/queries";
import { parseSelection } from "@/lib/validation";

export default async function ChooseSlotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Server-side validation of every incoming parameter. The dropdowns on the
  // previous step are UX only - this is the gate.
  const selection = parseSelection(await searchParams);
  if (!selection) notFound();

  const { level, year, subject } = selection;

  const service = await getServiceBySlug(selection.service);
  if (!service) notFound();

  const slots = await getAvailableSlots();

  const query = new URLSearchParams({
    service: service.slug,
    level,
    year,
    subject,
  }).toString();

  return (
    <div>
      <PageHeader title="Choose a time">
        {service.name} · {year} · {subject} -{" "}
        <span className="text-ink">{formatPrice(service.priceCents)}</span>
      </PageHeader>

      {slots.length === 0 ? (
        <Note className="mt-6">There are no available times at the moment.</Note>
      ) : (
        <SlotCalendar
          slots={slots.map((slot) => ({
            id: slot.id,
            startsAt: slot.startsAt.toISOString(),
          }))}
          query={query}
        />
      )}

      <BackLink href={`/book/level?service=${encodeURIComponent(service.slug)}`}>
        Back
      </BackLink>
    </div>
  );
}
