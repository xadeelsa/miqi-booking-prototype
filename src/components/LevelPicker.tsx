"use client";

import { useState } from "react";
import {
  SCHOOL_LEVELS,
  SCHOOL_LEVEL_LABELS,
  SUBJECTS_BY_LEVEL,
  YEARS_BY_LEVEL,
  type SchoolLevel,
} from "@/lib/catalog";

/**
 * Client component only because the year/subject options depend on the chosen
 * level. Submission is a plain GET form to /book/slots, so the resulting state
 * lives in the URL and the next step stays a Server Component.
 *
 * Level, year and subject names stay in Dutch — they are the real names of the
 * Dutch school system and don't have meaningful English equivalents.
 */
export function LevelPicker({ serviceSlug }: { serviceSlug: string }) {
  const [level, setLevel] = useState<SchoolLevel | "">("");

  const years = level ? YEARS_BY_LEVEL[level] : [];
  const subjects = level ? SUBJECTS_BY_LEVEL[level] : [];

  const selectClass =
    "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm disabled:bg-canvas disabled:text-muted";

  return (
    <form action="/book/slots" method="get" className="mt-6 space-y-5">
      <input type="hidden" name="service" value={serviceSlug} />

      <div>
        <label htmlFor="level" className="text-sm font-medium">
          School level
        </label>
        <select
          id="level"
          name="level"
          required
          value={level}
          onChange={(e) => setLevel(e.target.value as SchoolLevel | "")}
          className={selectClass}
        >
          <option value="">Make a choice</option>
          {SCHOOL_LEVELS.map((l) => (
            <option key={l} value={l}>
              {SCHOOL_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="year" className="text-sm font-medium">
          Year
        </label>
        <select
          id="year"
          name="year"
          required
          disabled={!level}
          className={selectClass}
          defaultValue=""
        >
          <option value="">
            {level ? "Make a choice" : "Choose a level first"}
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          required
          disabled={!level}
          className={selectClass}
          defaultValue=""
        >
          <option value="">
            {level ? "Make a choice" : "Choose a level first"}
          </option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-strong"
      >
        View available times
      </button>
    </form>
  );
}
