import { Resend } from "resend";
import { logger } from "@/lib/logger";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Vroom <onboarding@resend.dev>";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const client = getResend();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping email", { to: input.to, subject: input.subject });
    return;
  }

  try {
    await client.emails.send({
      from: FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.text && { text: input.text }),
    });
  } catch (err) {
    logger.error("Failed to send email via Resend", { error: err instanceof Error ? err.message : String(err) });
  }
}
