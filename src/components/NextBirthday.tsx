import type { CSSProperties } from "react";
import { ageTurning, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import { genitive } from "@/lib/tr";
import type { Member } from "@/lib/types";

/** Hero card: the next birthday on the calendar, or today's. `sorted` must be ordered by days left. */
export function NextBirthday({
  sorted,
  signedInMember = false,
}: {
  sorted: Member[];
  signedInMember?: boolean;
}) {
  const style = { "--i": 2 } as CSSProperties;

  if (sorted.length === 0) {
    const title = signedInMember ? "Henüz başka üye yok." : "İlk kayıt sende.";
    const text = signedInMember
      ? "Diğer üyeler kaydolunca doğum günleri burada görünür."
      : "Doğum gününü ekle, diğer üyeler seni kutlamayı kaçırmasın.";
    return (
      <aside className="next rise" style={style} aria-label={signedInMember ? "Henüz başka üye yok" : "Takvim boş"}>
        <p className="next__label">{signedInMember ? "Kaydın tamam" : "Takvim boş"}</p>
        <p className="next__empty">{title}</p>
        <p className="next__sub">{text}</p>
      </aside>
    );
  }

  const first = sorted[0];
  const days = daysUntilNextBirthday(first.birthday);
  const others = sorted.filter((m) => daysUntilNextBirthday(m.birthday) === days).length - 1;

  return (
    <aside
      className={days === 0 ? "next next--today rise" : "next rise"}
      style={style}
      aria-label="Sıradaki doğum günü"
    >
      <p className="next__label">{days === 0 ? "Bugün" : "Sıradaki doğum günü"}</p>

      <div className="next__figure">
        {days <= 1 ? (
          <span className="next__word">{days === 0 ? "Bugün" : "Yarın"}</span>
        ) : (
          <>
            <span className="next__num">{days}</span>
            <span className="next__unit">gün kaldı</span>
          </>
        )}
      </div>

      <div>
        <h2 className="next__name">{genitive(`${first.first_name} ${first.last_name}`)} doğum günü</h2>
        <p className="next__sub">
          {formatBirthdayLong(first.birthday)}
          {days === 0 ? `, ${ageTurning(first.birthday)} yaşına giriyor` : ""}
          {others > 0 ? ` (aynı gün ${others} kişi daha)` : ""}
        </p>
      </div>
    </aside>
  );
}
