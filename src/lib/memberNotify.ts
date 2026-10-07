import {
  bigNumber,
  bigWord,
  button,
  chips,
  emailShell,
  escapeHtml,
  fact,
  heading,
  paragraph,
  row,
  slab,
  slabTitle,
} from "@/lib/emailLayout";
import { ageTurning, formatBirthdayLong } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import { genitive } from "@/lib/tr";
import type { Member } from "@/lib/types";

/** Days-before-birthday points that trigger an opt-in reminder to teammates. 0 = the day itself. */
export const MEMBER_NOTIFY_MILESTONES = [7, 3, 0] as const;

/** Dedup key (in birthday_notifications.milestone) for the greeting the birthday person gets. */
export const SELF_GREETING_MILESTONE = -1;

const fullName = (m: Member) => `${m.first_name} ${m.last_name}`;

export function renderMemberNotificationSubject(member: Member, milestone: number): string {
  const name = genitive(fullName(member));
  return milestone === 0 ? `Bugün ${name} doğum günü` : `${name} doğum gününe ${milestone} gün kaldı`;
}

export function renderSelfGreetingSubject(member: Member): string {
  return `Doğum günün kutlu olsun, ${member.first_name}`;
}

const MANAGE_FOOTER = (siteUrl: string) =>
  `Bu e-postayı, doğum günü e-postalarını açtığın için Team1 Türkiye Doğum Günü Takvimi'nden alıyorsun. Kapatmak için <a href="${escapeHtml(siteUrl)}/kaydim" style="color:#B4B3BA;">Kaydımı Yönet</a> sayfasından ayarını değiştirebilirsin.`;

function profileBlock(member: Member, includeFacts: boolean): string {
  const parts: string[] = [];
  if (includeFacts && member.interests?.trim()) parts.push(fact("İlgi alanları", member.interests.trim()));
  if (includeFacts && member.note?.trim()) parts.push(fact("Not", member.note.trim()));
  const links = chips(member.socials.map((s) => ({ label: platformLabel(s.platform), url: s.url })));
  if (links) {
    parts.push(
      `<div style="margin:0 0 8px;font:600 12px/16px -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#9A99A3;letter-spacing:.04em;text-transform:uppercase;">Profiller</div>${links}`
    );
  }
  return parts.join("");
}

/** Heads-up (7 or 3 days) or the day itself (0), sent to teammates. */
export function renderMemberNotificationHtml(
  member: Member,
  milestone: number,
  siteUrl: string
): string {
  const name = fullName(member);
  const today = milestone === 0;

  const hero = today
    ? slab(
        "Bugün",
        bigWord("Bugün") +
          slabTitle(`${genitive(name)} doğum günü`, `${formatBirthdayLong(member.birthday)}, ${ageTurning(member.birthday)} yaşına giriyor`)
      )
    : slab(
        "Doğum gününe",
        bigNumber(milestone, "gün kaldı") +
          slabTitle(`${genitive(name)} doğum günü`, formatBirthdayLong(member.birthday))
      );

  const profile = profileBlock(member, true);
  const rows = [
    row(hero, "0"),
    row(
      heading(today ? "Bir mesaj atmanın tam zamanı." : "Kutlamayı kaçırma."),
      "36px 0 0"
    ),
    row(
      paragraph(
        today
          ? `${member.first_name} bugün yeni yaşına giriyor. Aşağıdaki profillerden ulaşıp kutlayabilirsin.`
          : `${member.first_name} için bir mesaj ya da küçük bir sürpriz hazırlamak istersen vakit var.`
      ),
      "0"
    ),
    profile ? row(profile, "24px 0 0") : "",
    row(button(siteUrl, "Takvimi aç"), "12px 0 0"),
  ].join("");

  return emailShell({
    title: renderMemberNotificationSubject(member, milestone),
    preheader: today
      ? `Bugün ${genitive(name)} doğum günü.`
      : `${genitive(name)} doğum gününe ${milestone} gün kaldı.`,
    siteUrl,
    rows,
    footer: MANAGE_FOOTER(siteUrl),
  });
}

/** Greeting for the birthday person themselves, on the day. */
export function renderSelfGreetingHtml(member: Member, siteUrl: string): string {
  const age = ageTurning(member.birthday);
  const rows = [
    row(
      slab(
        "Bugün senin günün",
        bigWord(member.first_name) +
          slabTitle("Doğum günün kutlu olsun.", age > 0 ? `${age} yaşına girdin.` : undefined)
      ),
      "0"
    ),
    row(heading("Yeni yaşın güzel geçsin."), "36px 0 0"),
    row(
      paragraph(
        "Team1 Türkiye topluluğu olarak yeni yaşında sana sağlık ve başarı diliyoruz. Bugün takvimde senin adın en üstte, topluluktan kutlama mesajları gelebilir."
      ),
      "0"
    ),
    row(button(siteUrl, "Takvimi aç"), "28px 0 0"),
  ].join("");

  return emailShell({
    title: renderSelfGreetingSubject(member),
    preheader: "Team1 Türkiye topluluğu doğum gününü kutluyor.",
    siteUrl,
    rows,
    footer: MANAGE_FOOTER(siteUrl),
  });
}
