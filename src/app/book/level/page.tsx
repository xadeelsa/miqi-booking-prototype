import { notFound } from "next/navigation";
import { Stepper } from "@/components/Stepper";
import { LevelPicker } from "@/components/LevelPicker";
import { getServiceBySlug } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export default async function ChooseLevelPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  // In Next 16 searchParams is a Promise and must be awaited.
  const { service: slug } = await searchParams;
  if (!slug) notFound();

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  return (
    <div>
      <Stepper current={2} />
      <h1 className="text-xl font-semibold tracking-tight">
        Level, year and subject
      </h1>
      <p className="mt-2 text-sm text-muted">
        Selected service: <span className="text-ink">{service.name}</span> —{" "}
        {formatPrice(service.priceCents)}
      </p>

      <LevelPicker serviceSlug={service.slug} />
    </div>
  );
}
