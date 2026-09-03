import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="h-1.5 bg-accent" aria-hidden />

      <div className="p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-soft">
          Huiswerkbegeleiding
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Book a session
        </h1>
        <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
          Choose a service, tell us the school level and subject, and reserve a
          time that suits you. You will receive a confirmation with a calendar
          invitation straight away.
        </p>

        <Link href="/book" className={buttonClass("primary", "mt-7")}>
          Start booking
        </Link>

        <ul className="mt-10 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
          <li>
            <p className="text-sm font-semibold text-ink">1-on-1 tutoring</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Bijles tailored to your child.
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-ink">Homework guidance</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Planning and completing schoolwork.
            </p>
          </li>
          <li>
            <p className="text-sm font-semibold text-ink">Exam training</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Focused preparation for tests and finals.
            </p>
          </li>
        </ul>

        <p className="mt-8 text-xs text-muted">
          This is a prototype using mock data. You can also view the{" "}
          <Link href="/admin" className="font-medium text-brand hover:text-brand-strong">
            admin overview
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
