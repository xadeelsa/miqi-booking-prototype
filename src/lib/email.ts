import { randomUUID } from "node:crypto";

/**
 * Mock mailer, shaped like `resend.emails.send` so the real client can drop in.
 * Nothing is delivered; the message goes to the server log.
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
      "MOCK EMAIL - not delivered (no provider configured)",
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
