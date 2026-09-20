import { NextRequest, NextResponse } from "next/server";
import { buildDigest, renderDigestEmailHtml } from "@/lib/digest";
import {
  MEMBER_NOTIFY_MILESTONES,
  renderMemberNotificationHtml,
  renderMemberNotificationSubject,
} from "@/lib/memberNotify";
import { sendEmail } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysUntilNextBirthday, nextOccurrenceYear } from "@/lib/date";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

type AdminMember = Member & { user_id: string | null; notify_opt_in: boolean };

/**
 * Sends each opted-in member (excluding the birthday person) a heads-up at
 * 15/5/3/0 days out. Runs entirely on the service-role client since it
 * needs cross-user data (auth.users emails, other members' notify_opt_in)
 * that RLS would otherwise block. Silently returns a skip reason when
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
  if (due.length === 0) return { ran: true, notified: 0 };

  const { data: userList, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersError) throw usersError;
  const emailByUserId = new Map(userList.users.map((u) => [u.id, u.email]));

  const recipientPool = (members as AdminMember[]).filter((m) => m.notify_opt_in && m.user_id);

  let notified = 0;
  for (const member of due) {
    const milestone = daysUntilNextBirthday(member.birthday);
    const occurrenceYear = nextOccurrenceYear(member.birthday);

    const { error: claimError } = await admin
      .from("birthday_notifications")
      .insert({ member_id: member.id, milestone, occurrence_year: occurrenceYear });
    if (claimError) {
      if (claimError.code === "23505") continue; // already notified for this milestone/year
      throw claimError;
    }

    const recipients = recipientPool
      .filter((m) => m.id !== member.id)
      .map((m) => emailByUserId.get(m.user_id as string))
      .filter((email): email is string => Boolean(email));
    if (recipients.length === 0) continue;

    await sendEmail({
      to: recipients,
      subject: renderMemberNotificationSubject(member, milestone),
      html: renderMemberNotificationHtml(member, milestone),
    });
    notified += 1;
  }

  return { ran: true, notified };
}

/**
 * Daily birthday digest + opt-in member notifications, triggered by Vercel
 * Cron (see vercel.json). When CRON_SECRET is set, Vercel automatically
 * sends it as a Bearer token on scheduled invocations — this route rejects
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
      ? `🎉 Bugün doğum günü olan ${today.length} kişi var — Team1 Türkiye`
      : `📅 Yaklaşan doğum günleri — Team1 Türkiye`;

  const digestResult = await sendEmail({
    to: recipients,
    subject,
    html: renderDigestEmailHtml(today, soon),
  });

  return NextResponse.json({
    digest: { today: today.length, soon: soon.length, ...digestResult },
    memberNotifications,
  });
}
