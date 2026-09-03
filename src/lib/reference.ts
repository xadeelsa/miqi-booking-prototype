import { randomInt } from "node:crypto";

/**
 * Booking references like `MIQI-7QK4P`. Parents read these out over the phone,
 * so the alphabet drops 0/O, 1/I/L and U. That leaves 30^5 codes, and the
 * column is UNIQUE, so callers retry on conflict (see `createBooking`).
 */

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const LENGTH = 5;

/** Derived from the alphabet so the generator and validator can't drift. */
export const REFERENCE_PATTERN = new RegExp(
  `^MIQI-[${ALPHABET}]{${LENGTH}}$`,
);

export function bookingReference(): string {
  let code = "";
  // randomInt, not `% ALPHABET.length`, which would favour the first 16.
  for (let i = 0; i < LENGTH; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return `MIQI-${code}`;
}
