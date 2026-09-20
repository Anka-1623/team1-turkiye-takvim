import { ageTurning, daysUntilLabel, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { Member } from "@/lib/types";

export function BirthdayCard({ member }: { member: Member }) {
  const days = daysUntilNextBirthday(member.birthday);
  const isToday = days === 0;

  return (
    <article
      className={`rounded-2xl border p-5 transition ${
        isToday
          ? "border-[var(--color-brand)]/50 bg-[var(--color-brand-soft)]"
          : "border-white/[0.08] bg-[var(--color-bg-card)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold text-[var(--color-fg)]">
            {member.first_name} {member.last_name}
          </h3>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            {formatBirthdayLong(member.birthday)}
            {isToday ? ` · ${ageTurning(member.birthday)} yaşına giriyor` : ""}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isToday
              ? "bg-[var(--color-brand)] text-white"
              : days <= 7
              ? "bg-white/10 text-[var(--color-fg)]"
              : "bg-white/5 text-[var(--color-muted)]"
          }`}
        >
          {isToday ? "Bugün 🎉" : daysUntilLabel(days)}
        </span>
      </div>

      {member.socials.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.socials.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-full border border-white/[0.08] px-2.5 py-1 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-brand)]/50 hover:text-[var(--color-fg)]"
            >
              {platformLabel(s.platform)} ↗
            </a>
          ))}
        </div>
      )}

      {member.interests && (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-fg)]">İlgi alanları:</span> {member.interests}
        </p>
      )}
      {member.note && (
        <p className="mt-1.5 text-sm text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-fg)]">Not:</span> {member.note}
        </p>
      )}
    </article>
  );
}
