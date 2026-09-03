import { randomInt } from "node:crypto";

/**
 * Human-facing booking references, e.g. `MIQI-7QK4P`.
 *
 * Parents read these out over the phone, so the alphabet drops the characters
 * that get misheard or mistyped: no 0/O, no 1/I/L, no U (which is heard as V).
 * That leaves 30 symbols and 30^5 ≈ 24 million codes - short enough to dictate,
 * and sparse enough that collisions are rare.
 *
 * Rare, though, is not never, and the reference column is UNIQUE. Callers are
 * expected to retry with a fresh code on conflict rather than assume this
 * function returns something unused (see `createBooking`).
 */

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const LENGTH = 5;

/**
 * Derived from the alphabet rather than written out, so the generator and the
 * validator can't drift apart.
 */
export const REFERENCE_PATTERN = new RegExp(
  `^MIQI-[${ALPHABET}]{${LENGTH}}$`,
);

export function bookingReference(): string {
  let code = "";
  // randomInt over the alphabet length rather than `% ALPHABET.length` on a
  // random byte, which would favour the first 16 symbols.
  for (let i = 0; i < LENGTH; i += 1) code += ALPHABET[randomInt(ALPHABET.length)];
  return `MIQI-${code}`;
}
