import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { LOGIN_EMAIL_SUBJECT, renderLoginEmailHtml } from "@/lib/loginEmail";
import { siteUrl } from "@/lib/siteUrl";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Anyone can hit this endpoint, and every call costs a mail. Cap per address,
// per caller and overall (counts live in login_email_log, service-role only).
// Resend's free plan sends 100 mails a day and the reminders and the admin
// digest draw from the same quota, so the overall caps stay well below it.
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const PER_EMAIL = { max: 3, windowMs: 15 * MINUTE };
const PER_IP = { max: 10, windowMs: HOUR };
const OVERALL_HOUR = { max: 40, windowMs: HOUR };
const OVERALL_DAY = { max: 80, windowMs: DAY };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

/**
 * Salted hash of the caller's IP (Vercel sets x-forwarded-for itself, a client can't spoof it),
 * so the log can rate-limit a caller without keeping the address. Null when there is no IP,
 * e.g. on localhost.
 */
function callerHash(req: Request): string | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim();
  if (!ip) return null;
  return createHash("sha256").update(`${process.env.CRON_SECRET ?? ""}:${ip}`).digest("hex");
}

/**
 * Passwordless login, sent from our own mail pipeline instead of Supabase's
 * built-in mailer: designed template, no dependence on the project's Site
 * URL setting (the link is built from the request's own origin), and no
 * built-in SMTP rate limit. Creates the account on first use, same as
 * signInWithOtp did.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { email?: unknown; next?: unknown } | null;

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const rawNext = typeof body?.next === "string" ? body.next : "";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\") ? rawNext : "/kaydim";

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const ipHash = callerHash(req);
  const countSince = async (windowMs: number, match?: { column: "email" | "ip_hash"; value: string }) => {
    let query = admin
      .from("login_email_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ago(windowMs));
    if (match) query = query.eq(match.column, match.value);
    const { count, error } = await query;
    if (error) console.error("[auth/login] rate-limit count failed:", error.message);
    return count ?? 0;
  };

  const [perEmail, perIp, overallHour, overallDay] = await Promise.all([
    countSince(PER_EMAIL.windowMs, { column: "email", value: email }),
    ipHash ? countSince(PER_IP.windowMs, { column: "ip_hash", value: ipHash }) : 0,
    countSince(OVERALL_HOUR.windowMs),
    countSince(OVERALL_DAY.windowMs),
  ]);
  if (
    perEmail >= PER_EMAIL.max ||
    perIp >= PER_IP.max ||
    overallHour >= OVERALL_HOUR.max ||
    overallDay >= OVERALL_DAY.max
  ) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const logged = await admin.from("login_email_log").insert({ email, ip_hash: ipHash });
  if (logged.error) {
    // Most likely the ip_hash column isn't there yet; keep the per-email and overall caps working.
    console.error("[auth/login] log insert failed, retrying without ip_hash:", logged.error.message);
    await admin.from("login_email_log").insert({ email });
  }
  await admin.from("login_email_log").delete().lt("created_at", ago(DAY));

  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[auth/login] generateLink failed:", error?.message ?? "no hashed_token");
    return NextResponse.json({ error: "link_failed" }, { status: 500 });
  }

  const origin = siteUrl(req);
  const type = data.properties.verification_type;
  const link = `${origin}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}&next=${encodeURIComponent(next)}`;

  try {
    const result = await sendEmail({
      to: [email],
      subject: LOGIN_EMAIL_SUBJECT,
      html: renderLoginEmailHtml({ link, siteUrl: origin }),
    });
    if (!result.sent) {
      console.error("[auth/login] mail not sent:", result.reason);
      return NextResponse.json({ error: "mail_failed" }, { status: 502 });
    }
  } catch (err) {
    console.error("[auth/login] mail provider error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "mail_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
