import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Vroom <onboarding@resend.dev>";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  try {
    await resend.emails.send({
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
