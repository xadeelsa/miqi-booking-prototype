import { describe, expect, test } from "vitest";
import {
  bookingInputSchema,
  bookingSelectionSchema,
  detailsSchema,
  fieldErrors,
  parseBookingSelection,
  parseReference,
  paymentOutcomeSchema,
  selectionSchema,
} from "@/lib/validation";

/**
 * The server boundary, no database. Inputs are written the way they arrive:
 * strings from a URL or a form, never pre-typed objects.
 */

/** A well-formed submission, as `FormData` and search params would supply it. */
function rawBooking(overrides: Record<string, unknown> = {}) {
  return {
    service: "bijles-1op1",
    level: "VWO",
    year: "Klas 4",
    subject: "Wiskunde",
    slot: "12",
    parentName: "Anne de Vries",
    parentEmail: "anne.devries@example.nl",
    parentPhone: "+31 6 1234 5678",
    studentName: "Sem de Vries",
    ...overrides,
  };
}

/** The first message per field, which is all the form can show. */
function errorsFor(input: Record<string, unknown>): Record<string, string> {
  const result = bookingInputSchema.safeParse(input);
  if (result.success) throw new Error("expected this input to be rejected");
  return fieldErrors(result.error);
}

describe("bookingInputSchema", () => {
  test("accepts a well-formed submission and normalises it", () => {
    const result = bookingInputSchema.parse(
      rawBooking({
        parentName: "  Anne de Vries  ",
        parentEmail: "  Anne.DeVries@Example.NL ",
        studentName: "Sem de Vries ",
      }),
    );

    expect(result).toStrictEqual({
      service: "bijles-1op1",
      level: "VWO",
      year: "Klas 4",
      subject: "Wiskunde",
      slot: 12,
      parentName: "Anne de Vries",
      parentEmail: "anne.devries@example.nl",
      parentPhone: "+31 6 1234 5678",
      studentName: "Sem de Vries",
    });
  });

  test("treats a blank phone number as absent rather than as an empty string", () => {
    // An untouched optional input posts "". undefined is what Prisma takes as
    // "no value given", so the column ends up NULL rather than empty.
    expect(
      bookingInputSchema.parse(rawBooking({ parentPhone: "" })).parentPhone,
    ).toBeUndefined();
    expect(
      bookingInputSchema.parse(rawBooking({ parentPhone: "   " })).parentPhone,
    ).toBeUndefined();
    expect(
      bookingInputSchema.parse(rawBooking({ parentPhone: " 06 1234 5678 " }))
        .parentPhone,
    ).toBe("06 1234 5678");
  });

  test("discards anything it was not asked for, including a price", () => {
    // The single most valuable field to forge.
    const result = bookingInputSchema.parse(
      rawBooking({ priceCents: 1, paymentStatus: "PAID", reference: "MIQI-AAAAA" }),
    );

    expect(result).not.toHaveProperty("priceCents");
    expect(result).not.toHaveProperty("paymentStatus");
    expect(result).not.toHaveProperty("reference");
  });

  test.each([
    ["a level that does not exist", { level: "UNIVERSITEIT" }, "level"],
    ["a missing service", { service: "  " }, "service"],
    ["a slot that is not a number", { slot: "abc" }, "slot"],
    ["a slot id of zero", { slot: "0" }, "slot"],
    ["a negative slot id", { slot: "-3" }, "slot"],
    ["a fractional slot id", { slot: "1.5" }, "slot"],
    ["an email without a domain", { parentEmail: "anne@" }, "parentEmail"],
    ["an email that is only a name", { parentEmail: "anne" }, "parentEmail"],
    ["a one-character parent name", { parentName: "A" }, "parentName"],
    ["a blank student name", { studentName: "   " }, "studentName"],
    ["an over-long phone number", { parentPhone: "0".repeat(41) }, "parentPhone"],
  ])("rejects %s", (_label, override, field) => {
    expect(Object.keys(errorsFor(rawBooking(override)))).toContain(field);
  });

  test("rejects a year that belongs to a different level", () => {
    // Both are real on their own. Only together are they nonsense.
    const errors = errorsFor(rawBooking({ year: "Groep 5" }));

    expect(errors.year).toBe("Groep 5 is not a year in VWO.");
    expect(errors).not.toHaveProperty("subject");
  });

  test("rejects a subject that is not taught at the level", () => {
    const errors = errorsFor(
      rawBooking({ level: "BASISSCHOOL", year: "Groep 5", subject: "Scheikunde" }),
    );

    expect(errors.subject).toBe("Scheikunde is not taught at BASISSCHOOL.");
    expect(errors).not.toHaveProperty("year");
  });

  test("reports every bad field at once, so the form fills in one pass", () => {
    const errors = errorsFor(
      rawBooking({ parentEmail: "nope", parentName: "A", studentName: "" }),
    );

    expect(Object.keys(errors).sort()).toStrictEqual([
      "parentEmail",
      "parentName",
      "studentName",
    ]);
  });

  test("holds back cross-field messages until the fields themselves are sound", () => {
    // level is unreadable, so the year check has no meaningful answer yet.
    const errors = errorsFor(rawBooking({ level: "UNIVERSITEIT", year: "Groep 5" }));

    expect(Object.keys(errors)).toStrictEqual(["level"]);
  });
});

describe("selection schemas", () => {
  test("selectionSchema ignores a slot, bookingSelectionSchema requires one", () => {
    const withoutSlot = {
      service: "bijles-1op1",
      level: "VWO",
      year: "Klas 4",
      subject: "Wiskunde",
    };

    expect(selectionSchema.parse(withoutSlot)).toStrictEqual(withoutSlot);
    expect(bookingSelectionSchema.safeParse(withoutSlot).success).toBe(false);
  });

  test("parseBookingSelection answers null instead of throwing, so pages can 404", () => {
    expect(parseBookingSelection(rawBooking())).toMatchObject({ slot: 12 });
    expect(parseBookingSelection({ service: "bijles-1op1" })).toBeNull();
    expect(parseBookingSelection(undefined)).toBeNull();
    expect(parseBookingSelection("bijles-1op1")).toBeNull();
  });
});

describe("detailsSchema", () => {
  test("vets the draft cookie the same way it vets the form", () => {
    // httpOnly, but still client input.
    expect(detailsSchema.safeParse({ parentName: "Anne de Vries" }).success).toBe(
      false,
    );
    expect(detailsSchema.safeParse(null).success).toBe(false);
    expect(
      detailsSchema.parse({
        parentName: "Anne de Vries",
        studentName: "Sem de Vries",
        parentEmail: "ANNE@EXAMPLE.NL",
      }),
    ).toStrictEqual({
      parentName: "Anne de Vries",
      studentName: "Sem de Vries",
      parentEmail: "anne@example.nl",
    });
  });
});

describe("parseReference", () => {
  test("accepts a real reference in any case", () => {
    expect(parseReference("MIQI-7QK4P")).toBe("MIQI-7QK4P");
    expect(parseReference("miqi-7qk4p")).toBe("MIQI-7QK4P");
    expect(parseReference("  miqi-7qk4p  ")).toBe("MIQI-7QK4P");
  });

  test.each([
    ["the ambiguous letters the alphabet excludes", "MIQI-OIL0U"],
    ["a missing prefix", "7QK4P"],
    ["the wrong prefix", "MIQX-7QK4P"],
    ["too few characters", "MIQI-7QK4"],
    ["too many characters", "MIQI-7QK4PP"],
    ["a separator that is not a hyphen", "MIQI_7QK4P"],
    ["nothing at all", ""],
  ])("rejects %s", (_label, input) => {
    expect(parseReference(input)).toBeNull();
  });

  test("rejects values that are not strings", () => {
    expect(parseReference(undefined)).toBeNull();
    expect(parseReference(12345)).toBeNull();
    expect(parseReference(["MIQI-7QK4P"])).toBeNull();
  });
});

describe("paymentOutcomeSchema", () => {
  test("allows only the two outcomes the form offers", () => {
    expect(paymentOutcomeSchema.parse("success")).toBe("success");
    expect(paymentOutcomeSchema.parse("failure")).toBe("failure");

    for (const bogus of ["", "paid", "SUCCESS", null, undefined, 1, true]) {
      expect(paymentOutcomeSchema.safeParse(bogus).success).toBe(false);
    }
  });
});
