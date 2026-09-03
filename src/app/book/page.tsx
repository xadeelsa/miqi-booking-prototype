import Link from "next/link";
import { Note } from "@/components/ui/Note";
import { PageHeader } from "@/components/ui/PageHeader";
import { getActiveServices } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

export default async function ChooseServicePage() {
  const services = await getActiveServices();

  return (
    <div>
      <PageHeader title="Choose a service">
        What would you like help with?
      </PageHeader>

      <ul className="mt-6 space-y-3">
        {services.map((service) => (
          <li key={service.id}>
            <Link
              href={`/book/level?service=${encodeURIComponent(service.slug)}`}
              className="group flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-5 transition hover:border-brand-soft"
            >
              <span className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-line transition group-hover:bg-accent"
                />
                <span>
                  <span className="block font-semibold">{service.name}</span>
                  <span className="mt-1 block text-sm leading-5 text-muted">
                    {service.description}
                  </span>
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
        <Note className="mt-6">
          No services available yet. Run <code>npm run db:seed</code>.
        </Note>
      )}
    </div>
  );
}
