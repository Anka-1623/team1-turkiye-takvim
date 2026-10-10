import type { CSSProperties } from "react";
import { genitive } from "@/lib/tr";
import type { Member } from "@/lib/types";

const fullName = (m: Member) => `${m.first_name} ${m.last_name}`;

/**
 * Hero slab. Only speaks on a birthday: it names everyone born today (the signed-in member
 * included, so their own name shows on their day). With nobody born today it is shown only
 * as an empty state while the calendar has no one else in it — there is deliberately no
 * countdown to the next birthday.
 */
export function TodayBirthday({
  today,
  signedInMember = false,
}: {
  today: Member[];
  signedInMember?: boolean;
}) {
  const style = { "--i": 2 } as CSSProperties;

  if (today.length === 1) {
    return (
      <aside className="slab rise" style={style} aria-label="Bugün doğum günü">
        <p className="slab-label">Bugün</p>
        <p className="slab-headline">{genitive(fullName(today[0]))} doğum günü</p>
      </aside>
    );
  }

  if (today.length > 1) {
    return (
      <aside className="slab rise" style={style} aria-label="Bugün doğum günü olanlar">
        <p className="slab-label">Bugün doğum günü</p>
        <ul className="slab-names">
          {today.map((m) => (
            <li key={m.id} className="slab-headline">
              {fullName(m)}
            </li>
          ))}
        </ul>
      </aside>
    );
  }

  if (signedInMember) {
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
