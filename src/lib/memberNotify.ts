import { escapeHtml } from "@/lib/digest";
import { formatBirthdayLong } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { Member } from "@/lib/types";

/** Days-before-birthday points that trigger an opt-in reminder to teammates. 0 = the day itself. */
export const MEMBER_NOTIFY_MILESTONES = [15, 5, 3, 0] as const;

function milestoneHeading(member: Member, milestone: number): string {
  const name = `${member.first_name} ${member.last_name}`;
  if (milestone === 0) return `🎉 Bugün ${name}'ın doğum günü!`;
  return `🎂 ${name}'ın doğum günü ${milestone} gün sonra`;
}

export function renderMemberNotificationSubject(member: Member, milestone: number): string {
  return milestoneHeading(member, milestone);
}

export function renderMemberNotificationHtml(member: Member, milestone: number): string {
  const name = escapeHtml(`${member.first_name} ${member.last_name}`);
  const links = member.socials
    .map(
      (s) =>
        `<a href="${escapeHtml(s.url)}" style="color:#E6212F;text-decoration:none;">${escapeHtml(
          platformLabel(s.platform)
        )}</a>`
    )
    .join(" &nbsp;·&nbsp; ");

  const extras: string[] = [];
  if (member.interests?.trim()) {
    extras.push(
      `<div style="margin-top:14px;"><span style="font-family:sans-serif;font-size:12px;font-weight:700;color:#9A9296;text-transform:uppercase;letter-spacing:.04em;">İlgi alanları</span><div style="font-family:sans-serif;font-size:14px;color:#F2EDEA;margin-top:4px;">${escapeHtml(member.interests)}</div></div>`
    );
  }
  if (member.note?.trim()) {
    extras.push(
      `<div style="margin-top:14px;"><span style="font-family:sans-serif;font-size:12px;font-weight:700;color:#9A9296;text-transform:uppercase;letter-spacing:.04em;">Not</span><div style="font-family:sans-serif;font-size:14px;color:#F2EDEA;margin-top:4px;">${escapeHtml(member.note)}</div></div>`
    );
  }

  return `<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#0B0607;">
    <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
      <div style="font-family:sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#E6212F;font-weight:700;">Team1 Türkiye</div>
      <div style="font-family:sans-serif;font-size:13px;color:#9A9296;margin-top:2px;">Doğum günü hatırlatması</div>
      <h2 style="font-family:sans-serif;color:#F2EDEA;font-size:18px;margin:24px 0 8px;">${milestoneHeading(member, milestone)}</h2>
      <div style="font-family:sans-serif;font-size:14px;color:#F2EDEA;">${name} — ${formatBirthdayLong(member.birthday)}</div>
      ${links ? `<div style="font-family:sans-serif;font-size:13px;color:#9A9296;margin-top:6px;">${links}</div>` : ""}
      ${extras.join("")}
      <div style="font-family:sans-serif;font-size:12px;color:#635C5F;margin-top:32px;">Bu e-postayı, doğum günü hatırlatmalarını açtığın için Team1 Türkiye doğum günü takviminden alıyorsun. Kapatmak için "Kaydımı Yönet" sayfasından ayarını değiştirebilirsin.</div>
    </div>
  </body>
</html>`;
}
