"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  dayKey,
  formatDayLong,
  formatTime,
} from "@/lib/format";

type Slot = { id: number; startsAt: string };

const TIME_ZONE = "Europe/Amsterdam";
const LOCALE = "en-GB";

function formatWeekdayShort(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatDayNumber(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

function formatWeekRange(start: Date, end: Date): string {
  const monthYear = new Intl.DateTimeFormat(LOCALE, {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  });
  const day = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    timeZone: TIME_ZONE,
  });
  if (monthYear.format(start) === monthYear.format(end)) {
    return `${day.format(start)} - ${day.format(end)} ${monthYear.format(start)}`;
  }
  const short = new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: TIME_ZONE,
  });
  return `${short.format(start)} - ${short.format(end)}`;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function mondayOf(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(iso, weekday === 0 ? -6 : 1 - weekday);
}

function civilNoon(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

function weekDaysFor(mondayIso: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayIso, i));
}

export function SlotCalendar({
  slots,
  query,
}: {
  slots: Slot[];
  query: string;
}) {
  const byDay = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = dayKey(new Date(slot.startsAt));
      const bucket = map.get(key);
      if (bucket) bucket.push(slot);
      else map.set(key, [slot]);
    }
    return map;
  }, [slots]);

  const mondays = useMemo(() => {
    const days = [...byDay.keys()].sort();
    if (days.length === 0) return [];
    const first = mondayOf(days[0]);
    const last = mondayOf(days[days.length - 1]);
    const weeks: string[] = [];
    for (let cursor = first; cursor <= last; cursor = addDays(cursor, 7)) {
      weeks.push(cursor);
    }
    return weeks;
  }, [byDay]);

  const firstAvailable = [...byDay.keys()].sort()[0] ?? "";
  const [weekIndex, setWeekIndex] = useState(() => {
    const i = mondays.indexOf(firstAvailable ? mondayOf(firstAvailable) : "");
    return i === -1 ? 0 : i;
  });
  const [selected, setSelected] = useState(firstAvailable);

  const monday = mondays[weekIndex] ?? mondays[0];
  const weekDays = monday ? weekDaysFor(monday) : [];
  const selectedSlots = byDay.get(selected) ?? [];

  function goWeek(next: number) {
    const mondayIso = mondays[next];
    if (!mondayIso) return;
    setWeekIndex(next);
    const inWeek = weekDaysFor(mondayIso).find((iso) => byDay.has(iso));
    if (inWeek) setSelected(inWeek);
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={() => goWeek(weekIndex - 1)}
          disabled={weekIndex <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg leading-none text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Previous week"
        >
          ‹
        </button>
        <p className="text-sm font-semibold">
          {monday
            ? formatWeekRange(civilNoon(monday), civilNoon(addDays(monday, 6)))
            : null}
        </p>
        <button
          type="button"
          onClick={() => goWeek(weekIndex + 1)}
          disabled={weekIndex >= mondays.length - 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-lg leading-none text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Next week"
        >
          ›
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose a day"
        className="grid grid-cols-7 gap-1 px-3 py-4 sm:gap-2 sm:px-5"
      >
        {weekDays.map((iso) => {
          const available = byDay.has(iso);
          const isSelected = iso === selected;
          const date = civilNoon(iso);
          return (
            <button
              key={iso}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={formatDayLong(date)}
              disabled={!available}
              onClick={() => setSelected(iso)}
              className={[
                "flex flex-col items-center rounded-xl px-1 py-2.5 text-center transition",
                isSelected
                  ? "bg-brand text-white"
                  : available
                    ? "hover:bg-brand-tint"
                    : "cursor-not-allowed text-muted/45",
              ].join(" ")}
            >
              <span
                className={[
                  "text-[10px] font-semibold uppercase tracking-wide sm:text-xs",
                  isSelected ? "text-white/80" : "text-muted",
                ].join(" ")}
              >
                {formatWeekdayShort(date)}
              </span>
              <span className="mt-1 text-sm font-semibold tabular-nums sm:text-base">
                {formatDayNumber(date)}
              </span>
              <span
                aria-hidden
                className={[
                  "mt-1.5 h-1 w-1 rounded-full",
                  isSelected
                    ? "bg-accent"
                    : available
                      ? "bg-brand-soft"
                      : "bg-transparent",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>

      <div className="border-t border-line px-4 py-5 sm:px-5">
        <h2 className="text-sm font-semibold capitalize">
          {selected ? formatDayLong(civilNoon(selected)) : "Choose a day"}
        </h2>
        {selectedSlots.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No times on this day.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {selectedSlots.map((slot) => (
              <li key={slot.id}>
                <Link
                  href={`/book/details?${query}&slot=${slot.id}`}
                  className="flex items-center justify-center rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm font-medium tabular-nums transition hover:border-brand hover:bg-surface hover:text-brand"
                >
                  {formatTime(new Date(slot.startsAt))}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
