import { NextRequest, NextResponse } from "next/server";
import { buildDigest, renderDigestEmailHtml } from "@/lib/digest";
import {
  SELF_GREETING_MILESTONE,
  renderMemberNotificationHtml,
  renderMemberNotificationSubject,
  renderSelfGreetingHtml,
  renderSelfGreetingSubject,
} from "@/lib/memberNotify";
import { dueMilestone } from "@/lib/milestone";
import { sendEmail } from "@/lib/email";
import { C, emailShell, escapeHtml, heading, paragraph, row } from "@/lib/emailLayout";
import { siteUrl } from "@/lib/siteUrl";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysUntilNextBirthday, nextOccurrenceYear } from "@/lib/date";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminMember = Member & { user_id: string | null; notify_opt_in: boolean };
type Admin = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Claims (member, milestone, year) in birthday_notifications, sends, and
 * releases the claim again if the mail did not actually go out, so a
 * missing Resend key or a transient error doesn't silently burn the
 * reminder for the whole year. Returns true when a mail was sent.
 */
async function sendOnce(
  admin: Admin,
  claim: { member_id: string; milestone: number; occurrence_year: number },
  mail: { to: string[]; subject: string; html: string }
): Promise<boolean> {
  if (mail.to.length === 0) return false;

  const { data: claimed, error: claimError } = await admin
    .from("birthday_notifications")
    .insert(claim)
    .select("id")
    .single();
  if (claimError) {
    if (claimError.code === "23505") return false; // already sent for this milestone/year
    throw claimError;
  }

  const release = () => admin.from("birthday_notifications").delete().eq("id", claimed.id);
  try {
    const result = await sendEmail(mail);
    if (!result.sent) {
      await release();
      return false;
    }
    return true;
  } catch (err) {
    await release();
    throw err;
  }
}

/**
 * Sends each approved, opted-in member (excluding the birthday person) a heads-up at
 * 7/3 days out and on the day, and the birthday person (if opted in) a
 * greeting on the day itself. A heads-up missed by a failed run is retried
 * the next day (see dueMilestone). Runs entirely on the service-role client
 * since it needs cross-user data (auth.users emails, other members'
 * notify_opt_in) that RLS would otherwise block. Silently returns a skip
 * reason when SUPABASE_SERVICE_ROLE_KEY isn't configured yet, mirroring how
 * the admin digest degrades when RESEND_API_KEY is missing.
 */
async function sendMemberNotifications() {
  const admin = createAdminClient();
  if (!admin) return { ran: false, reason: "SUPABASE_SERVICE_ROLE_KEY not configured" };

  const { data: members, error: membersError } = await admin
    .from("members")
    .select("id, first_name, last_name, birthday, socials, interests, wish, note, created_at, user_id, notify_opt_in")
    // Registrations still waiting for the lead's approval neither get reminders nor trigger them.
    .eq("approved", true);
  if (membersError) throw membersError;

  const due = (members as AdminMember[]).flatMap((member) => {
    const daysLeft = daysUntilNextBirthday(member.birthday);
    const milestone = dueMilestone(daysLeft);
    return milestone === null ? [] : [{ member, daysLeft, milestone }];
  });
  if (due.length === 0) return { ran: true, notified: 0, greetings: 0 };

  const { data: userList, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw usersError;
  const emailByUserId = new Map(userList.users.map((u) => [u.id, u.email]));
  const emailOf = (m: AdminMember) => (m.user_id ? emailByUserId.get(m.user_id) : undefined);

  const recipientPool = (members as AdminMember[]).filter((m) => m.notify_opt_in && m.user_id);
  const origin = siteUrl();

  let notified = 0;
  let greetings = 0;
  for (const { member, daysLeft, milestone } of due) {
    const occurrenceYear = nextOccurrenceYear(member.birthday);

    const to = recipientPool
      .filter((m) => m.id !== member.id)
      .map(emailOf)
      .filter((email): email is string => Boolean(email));
    const sent = await sendOnce(
      admin,
      { member_id: member.id, milestone, occurrence_year: occurrenceYear },
      {
        to,
        subject: renderMemberNotificationSubject(member, daysLeft),
        html: renderMemberNotificationHtml(member, daysLeft, origin),
      }
    );
    if (sent) notified += 1;

    if (milestone === 0 && member.notify_opt_in) {
      const own = emailOf(member);
      const greeted = await sendOnce(
        admin,
        { member_id: member.id, milestone: SELF_GREETING_MILESTONE, occurrence_year: occurrenceYear },
        {
          to: own ? [own] : [],
          subject: renderSelfGreetingSubject(member),
          html: renderSelfGreetingHtml(member, origin),
        }
      );
      if (greeted) greetings += 1;
    }
  }

  return { ran: true, notified, greetings };
}

const adminRecipients = () =>
  (process.env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

async function sendDigest() {
  const { today, soon } = await buildDigest();
  if (today.length === 0 && soon.length === 0) {
    return { sent: false, reason: "no birthdays today or in the lead window", today: 0, soon: 0 };
  }

  const subject =
    today.length > 0
      ? `Bugün doğum günü olan ${today.length} kişi var - Team1 Türkiye`
      : `Yaklaşan doğum günleri - Team1 Türkiye`;

  const result = await sendEmail({
    to: adminRecipients(),
    subject,
    html: renderDigestEmailHtml(today, soon, siteUrl()),
  });
  return { today: today.length, soon: soon.length, ...result };
}

/** Tells the admins a step of the cron failed. Best effort: if mail is what broke, this fails too. */
async function sendFailureNotice(errors: string[]) {
  try {
    const items = errors
      .map((e) => `<li style="margin:6px 0;font:14px/20px monospace;color:${C.ink2};">${escapeHtml(e)}</li>`)
      .join("");
    await sendEmail({
      to: adminRecipients(),
      subject: "Doğum günü cron'u hata verdi - Team1 Türkiye",
      html: emailShell({
        title: "Doğum günü cron'u hata verdi",
        preheader: "Bugünkü doğum günü işlemlerinin bir kısmı tamamlanamadı.",
        siteUrl: siteUrl(),
        rows:
          row(heading("Cron hata verdi"), "8px 0 0") +
          row(paragraph("Bugünkü doğum günü işlemlerinin bir kısmı tamamlanamadı. Ayrıntı Vercel loglarında da var."), "0") +
          row(`<ul style="margin:0;padding-left:20px;">${items}</ul>`, "16px 0 0"),
        footer: "Bu e-posta Team1 Türkiye Doğum Günü Takvimi'nin günlük cron'undan otomatik gönderildi.",
      }),
    });
  } catch (err) {
    console.error("[cron/birthday-digest] failure notice not sent:", err instanceof Error ? err.message : err);
  }
}

/**
 * Daily birthday digest + opt-in member notifications, triggered by Vercel
 * Cron (see vercel.json). When CRON_SECRET is set, Vercel automatically
 * sends it as a Bearer token on scheduled invocations. This route rejects
 * anything else.
 *
 * The two halves are independent: if the member notifications throw, the
 * admin digest is still sent, and vice versa. Any failure is logged, mailed
 * to the admins (best effort) and makes the invocation respond 500, so it
 * shows up as failed in Vercel.
 */
export async function GET(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const errors: string[] = [];
  const attempt = async (step: string, run: () => Promise<Record<string, unknown>>) => {
    try {
      return await run();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[cron/birthday-digest] ${step} failed:`, message);
      errors.push(`${step}: ${message}`);
      return { ran: false, error: message };
    }
  };

  const memberNotifications = await attempt("member notifications", sendMemberNotifications);
  const digest = await attempt("digest", sendDigest);

  if (errors.length > 0) await sendFailureNotice(errors);

  return NextResponse.json(
    { digest, memberNotifications, ...(errors.length > 0 ? { errors } : {}) },
    { status: errors.length > 0 ? 500 : 200 }
  );
}
