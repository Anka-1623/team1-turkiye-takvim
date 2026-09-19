type SendEmailParams = {
  to: string[];
  subject: string;
  html: string;
};

type SendEmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: string };

/**
 * Sends via the Resend REST API directly (no SDK dependency). Returns a
 * `{ sent: false }` result instead of throwing when RESEND_API_KEY is
 * unset, so the cron route degrades gracefully before the key is added.
 */
export async function sendDigestEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { sent: false, reason: "RESEND_API_KEY not configured" };
  }
  if (to.length === 0) {
    return { sent: false, reason: "ADMIN_NOTIFY_EMAILS not configured" };
  }

  const from = process.env.RESEND_FROM_EMAIL || "Team1 Türkiye <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { id: string };
  return { sent: true, id: json.id };
}
