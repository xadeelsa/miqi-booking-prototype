"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STEPS = [
  "Service",
  "Level",
  "Time",
  "Details",
  "Review",
  "Payment",
] as const;

function stepFromPath(pathname: string): number | null {
  if (pathname.startsWith("/book/confirmation")) return null;
  if (pathname.startsWith("/book/payment")) return 6;
  if (pathname.startsWith("/book/review")) return 5;
  if (pathname.startsWith("/book/details")) return 4;
  if (pathname.startsWith("/book/slots")) return 3;
  if (pathname.startsWith("/book/level")) return 2;
  if (pathname === "/book" || pathname === "/book/") return 1;
  return null;
}

function fillFor(step: number): number {
  return (step - 1) / (STEPS.length - 1);
}

export function Stepper() {
  const pathname = usePathname();
  const current = stepFromPath(pathname);
  const target = current == null ? 0 : fillFor(current);

  // A fresh mount starts a step back so the effect below has something to
  // animate. A client-side navigation keeps its state and moves from there.
  const [fill, setFill] = useState(
    current == null ? 0 : fillFor(Math.max(1, current - 1)),
  );
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (current == null) return;

    const id = requestAnimationFrame(() => {
      setAnimate(true);
      setFill(target);
    });
    return () => cancelAnimationFrame(id);
  }, [current, target]);

  if (current == null) return null;

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
          className={[
            "h-full w-full origin-left rounded-full bg-accent",
            animate
              ? "transition-transform duration-500 ease-in-out motion-reduce:transition-none"
              : "",
          ].join(" ")}
          style={{ transform: `scaleX(${fill})` }}
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
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition-colors duration-500 ease-in-out motion-reduce:transition-none",
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
                className={[
                  "transition-colors duration-500 ease-in-out motion-reduce:transition-none",
                  state === "current"
                    ? "font-semibold text-ink"
                    : state === "todo"
                      ? "text-muted"
                      : "text-ink",
                ].join(" ")}
              >
                {label}
              </span>
              {step < STEPS.length && (
                <span aria-hidden className="mx-1 text-line">
                  -
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
