type SendEmailParams = {
  to: string[];
  subject: string;
  html: string;
};

type SendEmailResult =
  | { sent: true; ids: string[] }
  | { sent: false; reason: string };

// Resend takes up to 100 messages per batch request.
const BATCH_SIZE = 100;

/**
 * Sends via the Resend REST API directly (no SDK dependency), one message per
 * recipient: nobody sees anyone else's address (members' e-mails would
 * otherwise leak to each other) and Resend's 50-recipients-per-message cap
 * never applies. Returns a `{ sent: false }` result instead of throwing when
 * RESEND_API_KEY or MAIL_FROM_EMAIL is unset, so the cron route degrades
 * gracefully before they're added.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  const recipients = [...new Set(to)];
  if (recipients.length === 0) {
    return { sent: false, reason: "no recipients" };
  }

  const senderEmail = process.env.MAIL_FROM_EMAIL;
  if (!senderEmail) {
    return { sent: false, reason: "MAIL_FROM_EMAIL not configured" };
  }
  const senderName = process.env.MAIL_FROM_NAME || "Team1 Türkiye";
  const from = `${senderName} <${senderEmail}>`;

  const ids: string[] = [];
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        recipients.slice(i, i + BATCH_SIZE).map((email) => ({ from, to: [email], subject, html }))
      ),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { data: { id: string }[] };
    ids.push(...json.data.map((m) => m.id));
  }

  return { sent: true, ids };
}
