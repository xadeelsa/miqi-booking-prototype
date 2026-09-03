import Link from "next/link";
import type { ReactNode } from "react";

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-brand"
    >
      <span aria-hidden>←</span>
      {children}
    </Link>
  );
}
