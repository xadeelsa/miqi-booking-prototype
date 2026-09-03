import type { ComponentProps } from "react";
import { cx } from "./styles";

const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary:
    "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** For `<Link>` and anything else that isn't a `<button>`. */
export function buttonClass(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return cx(
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold tracking-tight transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
    VARIANTS[variant],
    className,
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant }) {
  return <button {...props} className={buttonClass(variant, className)} />;
}
