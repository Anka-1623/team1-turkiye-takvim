import { supabase } from "@/lib/supabase";
import { ageTurning, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
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

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function memberRowHtml(m: Member, showAge: boolean): string {
  const name = escapeHtml(`${m.first_name} ${m.last_name}`);
  const age = showAge ? ` — ${ageTurning(m.birthday)} yaşına giriyor` : "";
  const links = m.socials
    .map(
      (s) =>
        `<a href="${escapeHtml(s.url)}" style="color:#E6212F;text-decoration:none;">${escapeHtml(
          platformLabel(s.platform)
        )}</a>`
    )
    .join(" &nbsp;·&nbsp; ");
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #262022;">
        <div style="font-family:sans-serif;font-size:16px;font-weight:700;color:#F2EDEA;">${name}${age}</div>
        <div style="font-family:sans-serif;font-size:13px;color:#9A9296;margin-top:2px;">${formatBirthdayLong(
          m.birthday
        )}${links ? " · " + links : ""}</div>
      </td>
    </tr>`;
}

export function renderDigestEmailHtml(today: Member[], soon: Member[]): string {
  const sections: string[] = [];
  if (today.length > 0) {
    sections.push(`
      <h2 style="font-family:sans-serif;color:#F2EDEA;font-size:18px;margin:24px 0 8px;">🎉 Bugün doğum günü olanlar</h2>
      <table style="width:100%;border-collapse:collapse;">${today.map((m) => memberRowHtml(m, true)).join("")}</table>
    `);
  }
  if (soon.length > 0) {
    sections.push(`
      <h2 style="font-family:sans-serif;color:#F2EDEA;font-size:18px;margin:24px 0 8px;">📅 ${LEAD_DAYS} gün sonra doğum günü olanlar</h2>
      <table style="width:100%;border-collapse:collapse;">${soon.map((m) => memberRowHtml(m, false)).join("")}</table>
    `);
  }

  return `<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#0B0607;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="font-family:sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#E6212F;font-weight:700;">Team1 Türkiye</div>
      <div style="font-family:sans-serif;font-size:13px;color:#9A9296;margin-top:2px;">Doğum günü hatırlatması</div>
      ${sections.join("")}
      <div style="font-family:sans-serif;font-size:12px;color:#635C5F;margin-top:32px;">Bu e-posta Team1 Türkiye doğum günü takviminin günlük otomatik özetidir.</div>
    </div>
  </body>
</html>`;
}
