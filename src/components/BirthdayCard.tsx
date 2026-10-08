import { ageTurning, daysUntilLabel, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { Member } from "@/lib/types";

/** One row of the birthday ledger: countdown, who, and what to know before congratulating. */
export function BirthdayCard({ member }: { member: Member }) {
  const days = daysUntilNextBirthday(member.birthday);
  const variant = days === 0 ? "bday-today" : days <= 7 ? "bday-soon" : "";

  return (
    <article className={`bday ${variant}`.trim()}>
      <div aria-label={daysUntilLabel(days)}>
        {days <= 1 ? (
          <span className="bday-word">{days === 0 ? "Bugün" : "Yarın"}</span>
        ) : (
          <>
            <span className="bday-num">{days}</span>
            <span className="bday-unit">gün</span>
          </>
        )}
      </div>

      <div className="bday-who">
        <h3 className="bday-name">
          {member.first_name} {member.last_name}
        </h3>
        <p className="bday-date">
          {formatBirthdayLong(member.birthday)}
          {days === 0 ? `, ${ageTurning(member.birthday)} yaşına giriyor` : ""}
        </p>
      </div>

      {(member.interests || member.note || member.socials.length > 0) && (
        <div className="bday-meta">
          {member.interests && (
            <p>
              <span className="k">İlgi alanları</span>
              {member.interests}
            </p>
          )}
          {member.note && (
            <p>
              <span className="k">Not</span>
              {member.note}
            </p>
          )}
          {member.socials.length > 0 && (
            <div className="bday-links">
              {member.socials.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer noopener">
                  {platformLabel(s.platform)} ↗
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
