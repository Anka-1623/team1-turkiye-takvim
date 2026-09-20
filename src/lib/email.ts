type SendEmailParams = {
  to: string[];
  subject: string;
  html: string;
};

type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

/**
 * Sends via the Brevo REST API directly (no SDK dependency). Returns a
 * `{ sent: false }` result instead of throwing when BREVO_API_KEY or
 * MAIL_FROM_EMAIL is unset, so the cron route degrades gracefully before
 * they're added.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "BREVO_API_KEY not configured" };
  }
  if (to.length === 0) {
    return { sent: false, reason: "no recipients" };
  }

  const senderEmail = process.env.MAIL_FROM_EMAIL;
  if (!senderEmail) {
    return { sent: false, reason: "MAIL_FROM_EMAIL not configured" };
  }
  const senderName = process.env.MAIL_FROM_NAME || "Team1 Türkiye";

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: to.map((email) => ({ email })),
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Brevo error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { messageId: string };
  return { sent: true, id: json.messageId };
}
