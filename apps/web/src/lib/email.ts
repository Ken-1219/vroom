import { Resend } from "resend";
import { logger } from "@/lib/logger";

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Vroom <noreply@vroom.app>";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const client = getResendClient();
  if (!client) {
    logger.warn("RESEND_API_KEY not set — skipping email delivery", {
      to: input.to,
      subject: input.subject,
    });
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
    logger.info("Email sent", { to: input.to, subject: input.subject });
  } catch (err) {
    logger.error("Failed to send email via Resend", {
      to: input.to,
      subject: input.subject,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
