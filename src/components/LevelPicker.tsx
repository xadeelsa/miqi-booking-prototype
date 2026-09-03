"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
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

  const placeholder = level ? "Make a choice" : "Choose a level first";

  return (
    <form action="/book/slots" method="get" className="mt-6 space-y-5">
      <input type="hidden" name="service" value={serviceSlug} />

      <Field label="School level">
        <Select
          name="level"
          required
          value={level}
          onChange={(e) => setLevel(e.target.value as SchoolLevel | "")}
        >
          <option value="">Make a choice</option>
          {SCHOOL_LEVELS.map((l) => (
            <option key={l} value={l}>
              {SCHOOL_LEVEL_LABELS[l]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Year">
        <Select name="year" required disabled={!level} defaultValue="">
          <option value="">{placeholder}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Subject">
        <Select name="subject" required disabled={!level} defaultValue="">
          <option value="">{placeholder}</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit">View available times</Button>
    </form>
  );
}
