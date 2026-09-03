import type { ComponentProps } from "react";
import { controlClass, cx } from "./styles";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cx(controlClass, className)} />;
}
