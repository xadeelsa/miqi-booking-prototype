import type { ComponentProps } from "react";
import { controlClass, cx } from "./styles";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input {...props} className={cx(controlClass, className)} />;
}
