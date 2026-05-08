import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? "noreply@vroom.app";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [input.to] },
    Message: {
      Subject: { Data: input.subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: input.html, Charset: "UTF-8" },
        ...(input.text && { Text: { Data: input.text, Charset: "UTF-8" } }),
      },
    },
  });

  try {
    await ses.send(command);
  } catch (err) {
    console.error("[SES] Failed to send email:", err);
  }
}
