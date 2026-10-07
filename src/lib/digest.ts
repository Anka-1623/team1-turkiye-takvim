import { supabase } from "@/lib/supabase";
import { ageTurning, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { C, chips, emailShell, escapeHtml, heading, row } from "@/lib/emailLayout";
import { platformLabel } from "@/lib/socials";
import type { Member } from "@/lib/types";

/** How many days ahead of a birthday the "heads up" section fires. */
export const LEAD_DAYS = 3;

export async function fetchAllMembers(): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("id, first_name, last_name, birthday, socials, interests, note, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

export async function buildDigest(): Promise<{ today: Member[]; soon: Member[] }> {
  const members = await fetchAllMembers();
  const today: Member[] = [];
  const soon: Member[] = [];
  for (const m of members) {
    const days = daysUntilNextBirthday(m.birthday);
    if (days === 0) today.push(m);
    else if (days === LEAD_DAYS) soon.push(m);
  }
  return { today, soon };
}

export { escapeHtml } from "@/lib/emailLayout";

const FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

function memberRowHtml(m: Member, showAge: boolean): string {
  const name = `${m.first_name} ${m.last_name}`;
  const age = showAge ? `, ${ageTurning(m.birthday)} yaşına giriyor` : "";
  const links = chips(m.socials.map((s) => ({ label: platformLabel(s.platform), url: s.url })));
  return `<tr><td style="padding:16px 0;border-top:1px solid ${C.line};">
    <div style="font:700 18px/24px ${FONT};letter-spacing:-.3px;color:${C.ink};">${escapeHtml(name)}</div>
    <div style="margin-top:2px;font:400 14px/20px ${FONT};color:${C.ink2};">${formatBirthdayLong(m.birthday)}${age}</div>
    ${links ? `<div style="margin-top:10px;">${links}</div>` : ""}
  </td></tr>`;
}

function section(title: string, members: Member[], showAge: boolean): string {
  return row(
    `<h2 style="margin:0 0 4px;font:700 24px/28px ${FONT};letter-spacing:-.6px;color:${C.ink};">${title}</h2>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${members
       .map((m) => memberRowHtml(m, showAge))
       .join("")}</table>`,
    "32px 0 0"
  );
}

export function renderDigestEmailHtml(today: Member[], soon: Member[], siteUrl: string): string {
  const rows = [
    row(heading("Günlük doğum günü özeti"), "8px 0 0"),
    today.length > 0 ? section("Bugün doğum günü olanlar", today, true) : "",
    soon.length > 0 ? section(`${LEAD_DAYS} gün sonra doğum günü olanlar`, soon, false) : "",
  ].join("");

  return emailShell({
    title: "Günlük doğum günü özeti",
    preheader:
      today.length > 0
        ? `Bugün doğum günü olan ${today.length} kişi var.`
        : `${LEAD_DAYS} gün sonra doğum günü olan ${soon.length} kişi var.`,
    siteUrl,
    rows,
    footer: "Bu e-posta Team1 Türkiye Doğum Günü Takvimi'nin günlük otomatik özetidir.",
  });
}
