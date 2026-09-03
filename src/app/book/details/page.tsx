import Link from "next/link";
import { notFound } from "next/navigation";
import { DetailsForm } from "@/components/DetailsForm";
import { Stepper } from "@/components/Stepper";
import { Note } from "@/components/ui/Note";
import {
  loadBookingContext,
  slotsHref,
  UNAVAILABLE_MESSAGES,
  type BookingSelection,
} from "@/lib/booking";
import { isValidLevel, isValidSubject, isValidYear } from "@/lib/catalog";
import { readDetailsDraft } from "@/lib/draft";
import { formatDateTime, formatPrice } from "@/lib/format";

type Params = {
  service?: string;
  level?: string;
  year?: string;
  subject?: string;
  slot?: string;
};

export default async function DetailsPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const { service, level, year, subject, slot } = await searchParams;

  if (!service || !level || !year || !subject || !slot) notFound();
  if (!isValidLevel(level)) notFound();
  if (!isValidYear(level, year)) notFound();
  if (!isValidSubject(level, subject)) notFound();

  const slotId = Number(slot);
  if (!Number.isSafeInteger(slotId) || slotId < 1) notFound();

  const selection: BookingSelection = {
    service,
    level,
    year,
    subject,
    slot: slotId,
  };
  const context = await loadBookingContext(selection);

  if (!context.ok) {
    return (
      <div>
        <Stepper current={4} />
        <h1 className="text-xl font-semibold tracking-tight">Your details</h1>
        <Note className="mt-6">{UNAVAILABLE_MESSAGES[context.reason]}</Note>
        <Link
          href={slotsHref(selection)}
          className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
        >
          Choose another time
        </Link>
      </div>
    );
  }

  const draft = await readDetailsDraft();

  return (
    <div>
      <Stepper current={4} />
      <h1 className="text-xl font-semibold tracking-tight">Your details</h1>
      <p className="mt-2 text-sm text-muted">
        {context.service.name} · {year} · {subject} ·{" "}
        {formatDateTime(context.slot.startsAt)} —{" "}
        <span className="text-ink">{formatPrice(context.priceCents)}</span>
      </p>

      <DetailsForm selection={selection} defaults={draft} />

      <Link
        href={slotsHref(selection)}
        className="mt-6 inline-block text-sm text-muted underline hover:text-ink"
      >
        Back
      </Link>
    </div>
  );
}
