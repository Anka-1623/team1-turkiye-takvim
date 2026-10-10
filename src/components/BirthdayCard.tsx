import { ageTurning, birthdayDayMonth, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { Member } from "@/lib/types";

/** One row of the birthday ledger: the date, who, and what to know before congratulating. */
export function BirthdayCard({ member }: { member: Member }) {
  const isToday = daysUntilNextBirthday(member.birthday) === 0;
  const { day, month } = birthdayDayMonth(member.birthday);

  return (
    <article className={isToday ? "bday bday-today" : "bday"}>
      <div aria-label={isToday ? "Bugün" : formatBirthdayLong(member.birthday)}>
        {isToday ? (
          <span className="bday-word">Bugün</span>
        ) : (
          <>
            <span className="bday-num">{day}</span>
            <span className="bday-unit">{month}</span>
          </>
        )}
      </div>

      <div className="bday-who">
        <h3 className="bday-name">
          {member.first_name} {member.last_name}
        </h3>
        {isToday && (
          <p className="bday-date">
            {formatBirthdayLong(member.birthday)}, {ageTurning(member.birthday)} yaşına giriyor
          </p>
        )}
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
