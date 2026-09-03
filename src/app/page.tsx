import Link from "next/link";

export default function HomePage() {
  return (
    <div className="rounded-xl border border-line bg-surface p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Book a session</h1>
      <p className="mt-3 max-w-prose text-sm leading-6 text-muted">
        Choose a service, tell us the school level and subject, and reserve a
        time that suits you. You will receive a confirmation with a calendar
        invitation straight away.
      </p>

      <Link
        href="/book"
        className="mt-6 inline-flex rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
      >
        Start booking
      </Link>

      <p className="mt-8 border-t border-line pt-4 text-xs text-muted">
        This is a prototype using fictitious data. You can also view the{" "}
        <Link href="/admin" className="underline hover:text-ink">
          admin overview
        </Link>
        .
      </p>
    </div>
  );
}
