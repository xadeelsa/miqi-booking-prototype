import { notFound } from "next/navigation";
import { LevelPicker } from "@/components/LevelPicker";
import { Stepper } from "@/components/Stepper";
import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader title="Level, year and subject">
        Selected service: <span className="text-ink">{service.name}</span> —{" "}
        {formatPrice(service.priceCents)}
      </PageHeader>

      <Card className="mt-6">
        <LevelPicker serviceSlug={service.slug} />
      </Card>

      <BackLink href="/book">Choose another service</BackLink>
    </div>
  );
}
