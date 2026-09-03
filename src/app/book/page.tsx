import Link from "next/link";
import { Stepper } from "@/components/Stepper";
import { getActiveServices } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export default async function ChooseServicePage() {
  const services = await getActiveServices();

  return (
    <div>
      <Stepper current={1} />
      <h1 className="text-xl font-semibold tracking-tight">Choose a service</h1>
      <p className="mt-2 text-sm text-muted">
        What would you like help with?
      </p>

      <ul className="mt-6 space-y-3">
        {services.map((service) => (
          <li key={service.id}>
            <Link
              href={`/book/level?service=${encodeURIComponent(service.slug)}`}
              className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5 transition hover:border-brand"
            >
              <span>
                <span className="block font-medium">{service.name}</span>
                <span className="mt-1 block text-sm text-muted">
                  {service.description}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-brand">
                {formatPrice(service.priceCents)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {services.length === 0 && (
        <p className="mt-6 rounded-lg border border-line bg-surface p-4 text-sm text-muted">
          No services available yet. Run <code>npm run db:seed</code>.
        </p>
      )}
    </div>
  );
}
