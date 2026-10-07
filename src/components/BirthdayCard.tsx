import { ArrowUpRightIcon } from "@/components/Icons";
import { ageTurning, daysUntilLabel, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { Member } from "@/lib/types";

/** One member: countdown chip, name, date, and what to know before congratulating. */
export function BirthdayCard({ member }: { member: Member }) {
  const days = daysUntilNextBirthday(member.birthday);
  const today = days === 0;
  const countdown = days === 0 ? "Bugün" : days === 1 ? "Yarın" : `${days} gün`;

  return (
    <article className={today ? "bday bday--today" : "bday"}>
      <div className="bday__top">
        {/* Red marks the week ahead; everything further out stays neutral. */}
        <span className={days <= 7 ? "chip chip--brand" : "chip"}>
          <span aria-hidden="true">{countdown}</span>
          <span className="sr-only">{daysUntilLabel(days)}</span>
        </span>
        <time className="bday__date" dateTime={member.birthday.slice(5)}>
          {formatBirthdayLong(member.birthday)}
        </time>
      </div>

      <h3 className="bday__name">
        {member.first_name} {member.last_name}
      </h3>
      {today && <p className="bday__age">{ageTurning(member.birthday)} yaşına giriyor</p>}

      {(member.interests || member.note) && (
        <div className="bday__facts">
          {member.interests && (
            <div>
              <span className="fact__k">İlgi alanları</span>
              <p className="fact__v">{member.interests}</p>
            </div>
          )}
          {member.note && (
            <div>
              <span className="fact__k">Not</span>
              <p className="fact__v">{member.note}</p>
            </div>
          )}
        </div>
      )}

      {member.socials.length > 0 && (
        <div className="bday__links">
          {member.socials.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer noopener" className="link-chip">
              {platformLabel(s.platform)}
              <ArrowUpRightIcon size={14} />
              <span className="sr-only">(yeni sekmede açılır)</span>
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
