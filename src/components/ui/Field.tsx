import type { ReactNode } from "react";
import { cx } from "./styles";

/**
 * Wraps the control in its `<label>`, so the two are associated natively — no
 * id/htmlFor pair to keep in sync. `error` sits inside the label too, which is
 * why it needs no aria-describedby.
 */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cx("block", className)}>
      <span className="text-sm font-medium text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      <span className="mt-1 block">{children}</span>
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}
