import type { CSSProperties } from "react";
import { ageTurning, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { genitive } from "@/lib/tr";
import type { Member } from "@/lib/types";

const fullName = (m: Member) => `${m.first_name} ${m.last_name}`;

/**
 * Hero slab: everyone whose birthday is today, otherwise the next birthday on the calendar.
 * `today` is everyone born on today's date (including the signed-in member, so their own name
 * shows on their day); `sorted` is the rest, ordered by days left.
 */
export function NextBirthday({
  today,
  sorted,
  signedInMember = false,
}: {
  today: Member[];
  sorted: Member[];
  signedInMember?: boolean;
}) {
  const style = { "--i": 2 } as CSSProperties;

  if (today.length > 0) {
    const [only] = today;
    return (
      <aside
        className="slab rise"
        style={style}
        aria-label={today.length === 1 ? "Bugün doğum günü" : "Bugün doğum günü olanlar"}
      >
        <p className="slab-label">Doğum günü</p>

        <div className="slab-main">
          <span className="slab-word">Bugün</span>
        </div>

        {today.length === 1 ? (
          <div>
            <p className="slab-name">{genitive(fullName(only))} doğum günü</p>
            <p className="slab-sub">
              {formatBirthdayLong(only.birthday)}, {ageTurning(only.birthday)} yaşına giriyor
            </p>
          </div>
        ) : (
          <div>
            <ul className="slab-names">
              {today.map((m) => (
                <li key={m.id} className="slab-name">
                  {fullName(m)}
                </li>
              ))}
            </ul>
            <p className="slab-sub">
              {formatBirthdayLong(only.birthday)}, {today.length} kişinin doğum günü
            </p>
          </div>
        )}
      </aside>
    );
  }

  if (sorted.length === 0 && signedInMember) {
    return (
      <aside className="slab rise" style={style} aria-label="Henüz başka üye yok">
        <p className="slab-label">Kaydın tamam</p>
        <div className="slab-main">
          <span className="slab-word">Henüz başka üye yok.</span>
        </div>
        <p className="slab-sub">Diğer üyeler kaydolunca doğum günleri burada görünür.</p>
      </aside>
    );
  }

  if (sorted.length === 0) {
    return (
      <aside className="slab rise" style={style} aria-label="Takvim boş">
        <p className="slab-label">Takvim boş</p>
        <div className="slab-main">
          <span className="slab-word">İlk kayıt sende.</span>
        </div>
        <p className="slab-sub">Doğum gününü ekle, diğer üyeler seni kutlamayı kaçırmasın.</p>
      </aside>
    );
  }

  const first = sorted[0];
  const days = daysUntilNextBirthday(first.birthday);
  const others = sorted.filter((m) => daysUntilNextBirthday(m.birthday) === days).length - 1;

  return (
    <aside className="slab rise" style={style} aria-label="Sıradaki doğum günü">
      <p className="slab-label">Sıradaki doğum günü</p>

      <div className="slab-main">
        {days === 1 ? (
          <span className="slab-word">Yarın</span>
        ) : (
          <>
            <span className="slab-num">{days}</span>
            <span className="slab-unit">gün kaldı</span>
          </>
        )}
      </div>

      <div>
        <p className="slab-name">{genitive(fullName(first))} doğum günü</p>
        <p className="slab-sub">
          {formatBirthdayLong(first.birthday)}
          {others > 0 ? ` (aynı gün ${others} kişi daha)` : ""}
        </p>
      </div>
    </aside>
  );
}
