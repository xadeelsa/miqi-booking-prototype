import type { ComponentProps } from "react";
import { cx } from "./styles";

/** Empty states, callouts, inline warnings. */
export function Note({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      {...props}
      className={cx(
        "rounded-lg border border-line bg-brand-tint p-4 text-sm leading-6 text-muted",
        className,
      )}
    />
  );
}
