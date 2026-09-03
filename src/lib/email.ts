import { randomUUID } from "node:crypto";

/**
 * Mock mailer, shaped like Resend on purpose.
 *
 * The request and response mirror `resend.emails.send` — `to` as an array,
 * `html`/`text` alongside each other, and a `{ data, error }` envelope rather
 * than a thrown exception. Swapping the mock for the real client is then an
 * import and an API key, not a refactor of every caller.
 *
 * Nothing is delivered: it writes the message to the server log so the
 * contents can be inspected while clicking through the funnel.
 */

export type SendEmailRequest = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendEmailResponse = {
  data: { id: string } | null;
  error: { message: string } | null;
};

export const EMAIL_FROM =
  process.env.EMAIL_FROM ??
  "MIQI Huiswerkbegeleiding <bookings@miqi.example>";

export async function sendEmail(
  request: SendEmailRequest,
): Promise<SendEmailResponse> {
  const rule = "─".repeat(64);

  console.info(
    [
      rule,
      "MOCK EMAIL — not delivered (no provider configured)",
      `from:    ${request.from}`,
      `to:      ${request.to.join(", ")}`,
      `subject: ${request.subject}`,
      rule,
      request.text,
      rule,
    ].join("\n"),
  );

  return { data: { id: `mock_${randomUUID()}` }, error: null };
}
