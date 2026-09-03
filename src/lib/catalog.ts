// Single source of truth for the (fictitious) selection options a parent picks
// during booking: school level, year, and subject. These are CAPTURED on a
// booking, not stored as database tables — so they live here as constants and
// are validated at the server boundary (see src/lib/validation.ts).

export const SCHOOL_LEVELS = [
  "BASISSCHOOL",
  "VMBO",
  "HAVO",
  "VWO",
] as const;

export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

export const SCHOOL_LEVEL_LABELS: Record<SchoolLevel, string> = {
  BASISSCHOOL: "Basisschool",
  VMBO: "VMBO",
  HAVO: "HAVO",
  VWO: "VWO",
};

// Which years (klassen / groepen) are valid for each level.
export const YEARS_BY_LEVEL: Record<SchoolLevel, string[]> = {
  BASISSCHOOL: ["Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  VMBO: ["Klas 1", "Klas 2", "Klas 3", "Klas 4"],
  HAVO: ["Klas 1", "Klas 2", "Klas 3", "Klas 4", "Klas 5"],
  VWO: ["Klas 1", "Klas 2", "Klas 3", "Klas 4", "Klas 5", "Klas 6"],
};

// Which subjects (vakken) are valid for each level.
export const SUBJECTS_BY_LEVEL: Record<SchoolLevel, string[]> = {
  BASISSCHOOL: ["Rekenen", "Nederlands", "Engels", "Begrijpend lezen"],
  VMBO: ["Wiskunde", "Nederlands", "Engels", "Biologie", "Economie"],
  HAVO: ["Wiskunde", "Nederlands", "Engels", "Natuurkunde", "Scheikunde", "Biologie", "Economie"],
  VWO: ["Wiskunde", "Nederlands", "Engels", "Natuurkunde", "Scheikunde", "Biologie", "Economie", "Geschiedenis"],
};

export function isValidLevel(value: string): value is SchoolLevel {
  return (SCHOOL_LEVELS as readonly string[]).includes(value);
}

export function isValidYear(level: SchoolLevel, year: string): boolean {
  return YEARS_BY_LEVEL[level].includes(year);
}

export function isValidSubject(level: SchoolLevel, subject: string): boolean {
  return SUBJECTS_BY_LEVEL[level].includes(subject);
}
