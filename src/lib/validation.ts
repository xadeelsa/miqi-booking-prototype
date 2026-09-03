import { z } from "zod";
import { SCHOOL_LEVELS, SUBJECTS_BY_LEVEL, YEARS_BY_LEVEL } from "./catalog";
import { REFERENCE_PATTERN } from "./reference";

/**
 * The server boundary. Everything from a URL or a form is parsed here, and
 * nothing the client sent is trusted, including the options the pickers
 * offered.
 */

const selectionShape = {
  service: z.string().trim().min(1),
  level: z.enum(SCHOOL_LEVELS),
  year: z.string().trim().min(1),
  subject: z.string().trim().min(1),
};

const slotShape = {
  // Search params are always strings; coerce, then insist on a real row id.
  slot: z.coerce.number().int().positive(),
};

const detailsShape = {
  parentName: z
    .string()
    .trim()
    .min(2, "Please enter the parent or guardian's name.")
    .max(120, "That name is too long."),
  studentName: z
    .string()
    .trim()
    .min(2, "Please enter the student's name.")
    .max(120, "That name is too long."),
  parentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address."))
    .pipe(z.string().max(200, "That email address is too long.")),
  parentPhone: z
    .string()
    .trim()
    .max(40, "That phone number is too long.")
    // Optional on the Booking, so blank means absent rather than empty.
    .transform((value) => value || undefined)
    .optional(),
};

/** year and subject are only valid relative to level, so this is a refinement. */
const checkCatalog: z.core.CheckFn<{
  level: (typeof SCHOOL_LEVELS)[number];
  year: string;
  subject: string;
}> = ({ value, issues }) => {
  if (!YEARS_BY_LEVEL[value.level].includes(value.year)) {
    issues.push({
      code: "custom",
      input: value.year,
      path: ["year"],
      message: `${value.year} is not a year in ${value.level}.`,
    });
  }
  if (!SUBJECTS_BY_LEVEL[value.level].includes(value.subject)) {
    issues.push({
      code: "custom",
      input: value.subject,
      path: ["subject"],
      message: `${value.subject} is not taught at ${value.level}.`,
    });
  }
};

/** Steps 1–2: what service, and who for. */
export const selectionSchema = z.object(selectionShape).check(checkCatalog);

/** Steps 3–5: the above plus a chosen slot. */
export const bookingSelectionSchema = z
  .object({ ...selectionShape, ...slotShape })
  .check(checkCatalog);

/** The details form on its own, also used to vet the draft cookie. */
export const detailsSchema = z.object(detailsShape);

/** Everything needed to write a Booking, minus the server-computed price. */
export const bookingInputSchema = z
  .object({ ...selectionShape, ...slotShape, ...detailsShape })
  .check(checkCatalog);

/** Which branch of the simulated payment to take. */
export const paymentOutcomeSchema = z.enum(["success", "failure"]);

export type PaymentOutcome = z.infer<typeof paymentOutcomeSchema>;

/** A reference out of a URL, uppercased so lower-case typing still resolves. */
export const referenceSchema = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.string().regex(REFERENCE_PATTERN, "That is not a booking reference."));

export function parseReference(input: unknown): string | null {
  const result = referenceSchema.safeParse(input);
  return result.success ? result.data : null;
}

export type Selection = z.infer<typeof selectionSchema>;
export type BookingSelection = z.infer<typeof bookingSelectionSchema>;
export type BookingDetails = z.infer<typeof detailsSchema>;
export type BookingInput = z.infer<typeof bookingInputSchema>;

export const DETAIL_FIELDS = [
  "parentName",
  "studentName",
  "parentEmail",
  "parentPhone",
] as const;

export type DetailField = (typeof DETAIL_FIELDS)[number];

/** First message per field, which is all `<Field error>` can show. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** `null` means "this was never a real booking", so callers 404. */
export function parseSelection(input: unknown): Selection | null {
  const result = selectionSchema.safeParse(input);
  return result.success ? result.data : null;
}

export function parseBookingSelection(input: unknown): BookingSelection | null {
  const result = bookingSelectionSchema.safeParse(input);
  return result.success ? result.data : null;
}
