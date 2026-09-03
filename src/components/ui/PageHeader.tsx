import type { ReactNode } from "react";

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <header>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {children && (
        <p className="mt-2 max-w-prose text-sm leading-6 text-muted">
          {children}
        </p>
      )}
    </header>
  );
}
