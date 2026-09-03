import type { ComponentProps } from "react";
import { cx } from "./styles";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cx(
        "rounded-xl border border-line bg-surface p-5 sm:p-6",
        className,
      )}
    />
  );
}
