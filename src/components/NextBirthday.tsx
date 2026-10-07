import type { CSSProperties } from "react";
import { ageTurning, daysUntilNextBirthday, formatBirthdayLong } from "@/lib/date";
import type { Member } from "@/lib/types";

/** Hero slab: the next birthday on the calendar, or today's. `sorted` must be ordered by days left. */
export function NextBirthday({ sorted }: { sorted: Member[] }) {
  const style = { "--i": 2 } as CSSProperties;

  if (sorted.length === 0) {
    return (
      <aside className="slab rise" style={style} aria-label="Takvim boş">
        <p className="slab-label">Takvim boş</p>
        <div className="slab-main">
          <span className="slab-word">İlk kayıt sende.</span>
        </div>
        <p className="slab-sub">Doğum gününü ekle, diğer üyeler seni kutlamayı kaçırmasın.</p>
        <span className="slab-mark" aria-hidden="true" />
      </aside>
    );
  }

  const first = sorted[0];
  const days = daysUntilNextBirthday(first.birthday);
  const others = sorted.filter((m) => daysUntilNextBirthday(m.birthday) === days).length - 1;

  return (
    <aside className="slab rise" style={style} aria-label="Sıradaki doğum günü">
      <p className="slab-label">{days === 0 ? "Bugün doğum günü" : "Sıradaki doğum günü"}</p>

      <div className="slab-main">
        {days <= 1 ? (
          <span className="slab-word">{days === 0 ? "Bugün" : "Yarın"}</span>
        ) : (
          <>
            <span className="slab-num">{days}</span>
            <span className="slab-unit">gün sonra</span>
          </>
        )}
      </div>

      <div>
        <p className="slab-name">
          {first.first_name} {first.last_name}
        </p>
        <p className="slab-sub">
          {formatBirthdayLong(first.birthday)}
          {days === 0 ? `, ${ageTurning(first.birthday)} yaşına giriyor` : ""}
          {others > 0 ? ` (aynı gün ${others} kişi daha)` : ""}
        </p>
      </div>

      <span className="slab-mark" aria-hidden="true" />
    </aside>
  );
}
