// The options a parent picks: school level, year, subject. Captured on a
// booking rather than stored as tables, so they live here as constants.
// src/lib/validation.ts decides whether an incoming combination is valid.

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