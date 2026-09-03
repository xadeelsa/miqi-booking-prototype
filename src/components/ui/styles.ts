/** Bits shared by more than one primitive. Everything else lives with its component. */

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/** Input, Select and Textarea all wear this. */
export const controlClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm disabled:bg-canvas disabled:text-muted";
