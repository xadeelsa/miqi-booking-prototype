"use client";

import { useState } from "react";
import Form from "next/form";
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

/** Client component because the year and subject options depend on the level. */
export function LevelPicker({ serviceSlug }: { serviceSlug: string }) {
  const [level, setLevel] = useState<SchoolLevel | "">("");

  const years = level ? YEARS_BY_LEVEL[level] : [];
  const subjects = level ? SUBJECTS_BY_LEVEL[level] : [];

  const placeholder = level ? "Make a choice" : "Choose a level first";

  return (
    <Form action="/book/slots" className="space-y-5">
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
    </Form>
  );
}
