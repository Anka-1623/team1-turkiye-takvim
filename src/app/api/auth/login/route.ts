import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { LOGIN_EMAIL_SUBJECT, renderLoginEmailHtml } from "@/lib/loginEmail";
import { siteUrl } from "@/lib/siteUrl";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Anyone can hit this endpoint, and every call costs a mail. Cap per address
// and overall (counts live in login_email_log, service-role only).
const PER_EMAIL = { max: 3, windowMs: 15 * 60_000 };
const OVERALL = { max: 120, windowMs: 60 * 60_000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

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

  const [perEmail, overall] = await Promise.all([
    admin
      .from("login_email_log")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", ago(PER_EMAIL.windowMs)),
    admin
      .from("login_email_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", ago(OVERALL.windowMs)),
  ]);
  if ((perEmail.count ?? 0) >= PER_EMAIL.max || (overall.count ?? 0) >= OVERALL.max) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  await admin.from("login_email_log").insert({ email });
  await admin.from("login_email_log").delete().lt("created_at", ago(24 * 60 * 60_000));

  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
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
    if (!result.sent) return NextResponse.json({ error: "mail_failed" }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "mail_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
