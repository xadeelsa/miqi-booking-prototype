/** Bits shared by more than one primitive. Everything else lives with its component. */

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/** Input, Select and Textarea all wear this. */
export const controlClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition placeholder:text-muted hover:border-brand-soft/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-canvas disabled:text-muted disabled:hover:border-line aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-500/20";
