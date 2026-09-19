import { NextRequest, NextResponse } from "next/server";
import { buildDigest, renderDigestEmailHtml } from "@/lib/digest";
import { sendDigestEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * Daily birthday digest, triggered by Vercel Cron (see vercel.json).
 * When CRON_SECRET is set, Vercel automatically sends it as a Bearer token
 * on scheduled invocations — this route rejects anything else.
 */
export async function GET(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const { today, soon } = await buildDigest();

  if (today.length === 0 && soon.length === 0) {
    return NextResponse.json({ sent: false, reason: "no birthdays today or in the lead window", today: 0, soon: 0 });
  }

  const recipients = (process.env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const subject =
    today.length > 0
      ? `🎉 Bugün doğum günü olan ${today.length} kişi var — Kozalak Takvim`
      : `📅 Yaklaşan doğum günleri — Kozalak Takvim`;

  const result = await sendDigestEmail({
    to: recipients,
    subject,
    html: renderDigestEmailHtml(today, soon),
  });

  return NextResponse.json({ today: today.length, soon: soon.length, ...result });
}
