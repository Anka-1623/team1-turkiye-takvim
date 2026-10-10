import { NextRequest, NextResponse } from "next/server";
import { buildDigest, renderDigestEmailHtml } from "@/lib/digest";
import {
  MEMBER_NOTIFY_MILESTONES,
  SELF_GREETING_MILESTONE,
  renderMemberNotificationHtml,
  renderMemberNotificationSubject,
  renderSelfGreetingHtml,
  renderSelfGreetingSubject,
} from "@/lib/memberNotify";
import { sendEmail } from "@/lib/email";
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
 * Sends each opted-in member (excluding the birthday person) a heads-up at
 * 7/3/0 days out, and the birthday person (if opted in) a greeting on the
 * day itself. Runs entirely on the service-role client since it needs
 * cross-user data (auth.users emails, other members' notify_opt_in) that
 * RLS would otherwise block. Silently returns a skip reason when
 * SUPABASE_SERVICE_ROLE_KEY isn't configured yet, mirroring how the admin
 * digest degrades when RESEND_API_KEY is missing.
 */
async function sendMemberNotifications() {
  const admin = createAdminClient();
  if (!admin) return { ran: false, reason: "SUPABASE_SERVICE_ROLE_KEY not configured" };

  const { data: members, error: membersError } = await admin
    .from("members")
    .select("id, first_name, last_name, birthday, socials, interests, note, created_at, user_id, notify_opt_in");
  if (membersError) throw membersError;

  const due = (members as AdminMember[]).filter((m) =>
    (MEMBER_NOTIFY_MILESTONES as readonly number[]).includes(daysUntilNextBirthday(m.birthday))
  );
  if (due.length === 0) return { ran: true, notified: 0, greetings: 0 };

  const { data: userList, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw usersError;
  const emailByUserId = new Map(userList.users.map((u) => [u.id, u.email]));
  const emailOf = (m: AdminMember) => (m.user_id ? emailByUserId.get(m.user_id) : undefined);

  const recipientPool = (members as AdminMember[]).filter((m) => m.notify_opt_in && m.user_id);
  const origin = siteUrl();

  let notified = 0;
  let greetings = 0;
  for (const member of due) {
    const milestone = daysUntilNextBirthday(member.birthday);
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
        subject: renderMemberNotificationSubject(member, milestone),
        html: renderMemberNotificationHtml(member, milestone, origin),
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

/**
 * Daily birthday digest + opt-in member notifications, triggered by Vercel
 * Cron (see vercel.json). When CRON_SECRET is set, Vercel automatically
 * sends it as a Bearer token on scheduled invocations. This route rejects
 * anything else.
 */
export async function GET(req: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const memberNotifications = await sendMemberNotifications();

  const { today, soon } = await buildDigest();
  if (today.length === 0 && soon.length === 0) {
    return NextResponse.json({
      digest: { sent: false, reason: "no birthdays today or in the lead window", today: 0, soon: 0 },
      memberNotifications,
    });
  }

  const recipients = (process.env.ADMIN_NOTIFY_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const subject =
    today.length > 0
      ? `Bugün doğum günü olan ${today.length} kişi var - Team1 Türkiye`
      : `Yaklaşan doğum günleri - Team1 Türkiye`;

  const digestResult = await sendEmail({
    to: recipients,
    subject,
    html: renderDigestEmailHtml(today, soon, siteUrl()),
  });

  return NextResponse.json({
    digest: { today: today.length, soon: soon.length, ...digestResult },
    memberNotifications,
  });
}
