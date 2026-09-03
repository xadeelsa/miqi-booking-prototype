// Single source of truth for the (fictitious) selection options a parent picks
// during booking: school level, year, and subject. These are CAPTURED on a
// booking, not stored as database tables — so they live here as constants.
//
// This module only describes what exists. Deciding whether an incoming
// combination is valid is src/lib/validation.ts's job.

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