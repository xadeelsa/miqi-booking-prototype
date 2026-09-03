const STEPS = ["Service", "Level", "Time", "Details", "Payment"] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const state =
          step < current ? "done" : step === current ? "current" : "todo";
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                state === "current"
                  ? "border-brand bg-brand text-white"
                  : state === "done"
                    ? "border-brand text-brand"
                    : "border-line text-muted",
              ].join(" ")}
            >
              {step}
            </span>
            <span className={state === "todo" ? "text-muted" : "text-ink"}>
              {label}
            </span>
            {step < STEPS.length && (
              <span aria-hidden className="text-line">
                —
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
