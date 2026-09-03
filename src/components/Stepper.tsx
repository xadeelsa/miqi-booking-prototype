const STEPS = [
  "Service",
  "Level",
  "Time",
  "Details",
  "Review",
  "Payment",
] as const;

export function Stepper({ current }: { current: number }) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;

  return (
    <nav aria-label="Booking progress" className="mb-8">
      <p className="mb-3 text-xs font-medium text-muted">
        Step {current} of {STEPS.length}
        <span className="text-ink"> · {STEPS[current - 1]}</span>
      </p>

      <div
        className="mb-4 h-1 overflow-hidden rounded-full bg-line"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="hidden flex-wrap gap-x-1 gap-y-1 text-xs sm:flex">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const state =
            step < current ? "done" : step === current ? "current" : "todo";
          return (
            <li
              key={label}
              className="flex items-center gap-1.5"
              aria-current={state === "current" ? "step" : undefined}
            >
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                  state === "current"
                    ? "bg-accent text-white"
                    : state === "done"
                      ? "bg-brand text-white"
                      : "bg-line text-muted",
                ].join(" ")}
              >
                {step}
              </span>
              <span
                className={
                  state === "current"
                    ? "font-semibold text-ink"
                    : state === "todo"
                      ? "text-muted"
                      : "text-ink"
                }
              >
                {label}
              </span>
              {step < STEPS.length && (
                <span aria-hidden className="mx-1 text-line">
                  —
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
