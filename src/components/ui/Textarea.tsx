import type { ComponentProps } from "react";
import { controlClass, cx } from "./styles";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(controlClass, className)} />;
}
