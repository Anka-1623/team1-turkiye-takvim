import Link from "next/link";
import type { CSSProperties } from "react";
import { BirthdayCard } from "@/components/BirthdayCard";
import { NextBirthday } from "@/components/NextBirthday";
import { daysUntilNextBirthday, istanbulToday, nextOccurrenceYear } from "@/lib/date";
import { fetchAllMembers } from "@/lib/digest";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTH_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const monthOf = (birthday: string) => Number(birthday.slice(5, 7));

function monthName(month: number): string {
  return new Intl.DateTimeFormat("tr-TR", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, month - 1, 1))
  );
}

type Group = { key: string; month: number; year: number; members: Member[] };

/** Consecutive runs of the (already sorted) list that fall in the same month of their next occurrence. */
function groupByMonth(sorted: Member[]): Group[] {
  const groups: Group[] = [];
  for (const m of sorted) {
    const month = monthOf(m.birthday);
    const year = nextOccurrenceYear(m.birthday);
    const key = `${year}-${month}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.members.push(m);
    else groups.push({ key, month, year, members: [m] });
  }
  return groups;
}

export default async function HomePage() {
  // A signed-in member already knows their own birthday, so the panel shows everyone else's.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let ownId: string | null = null;
  if (user) {
    const { data } = await supabase.rpc("get_my_member");
    ownId = (data?.[0] as { id: string } | undefined)?.id ?? null;
  }

  const members = (await fetchAllMembers()).filter((m) => m.id !== ownId);
  const sorted = [...members].sort(
    (a, b) => daysUntilNextBirthday(a.birthday) - daysUntilNextBirthday(b.birthday)
  );

  const thisMonth = istanbulToday().getUTCMonth() + 1;
  const thisYear = istanbulToday().getUTCFullYear();
  const perMonth = Array.from({ length: 12 }, (_, i) =>
    members.filter((m) => monthOf(m.birthday) === i + 1).length
  );
  const maxPerMonth = Math.max(...perMonth, 1);

  const groups = groupByMonth(sorted);
  const anchored = new Set<number>();

  return (
    <>
      <section className="shell hero">
        <div className="hero__copy">
          <p className="eyebrow rise">Team1 Türkiye</p>
          <div className="hero__title">
            <h1 className="display rise" style={{ "--i": 1 } as CSSProperties}>
              Doğum Günü Takvimi
            </h1>
            <p className="lead rise" style={{ "--i": 2 } as CSSProperties}>
              Üyelerin doğum günleri tek yerde. Kaydını ekle, yaklaşanları gör, kimseyi kutlamayı kaçırma.
            </p>
          </div>
          <div className="hero__actions rise" style={{ "--i": 3 } as CSSProperties}>
            <Link href="/kayit" className="btn btn-primary">
              Doğum günümü ekle
            </Link>
            <Link href="/kaydim" className="btn btn-secondary">
              Kaydımı yönet
            </Link>
          </div>
        </div>

        <NextBirthday sorted={sorted} signedInMember={ownId !== null} />
      </section>

      {members.length > 0 && (
        <>
          <section className="shell section" aria-labelledby="aylar">
            <div className="section__head">
              <h2 id="aylar">Aylara göre</h2>
              <p>Toplam {members.length} üye. Bir aya dokun, o ayın doğum günlerine git.</p>
            </div>

            <nav className="months" aria-label="Aylara göre doğum günü sayısı">
              {perMonth.map((count, i) => {
                const month = i + 1;
                const cls = [
                  "month",
                  month === thisMonth ? "month--now" : "",
                  count === 0 ? "month--empty" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                const inner = (
                  <>
                    <span className="month__plot" aria-hidden="true">
                      {count > 0 && (
                        <span
                          className="month__bar"
                          style={
                            {
                              height: `${Math.max(10, (count / maxPerMonth) * 100)}%`,
                              "--i": i,
                            } as CSSProperties
                          }
                        />
                      )}
                    </span>
                    <span className="month__count">{count}</span>
                    <span className="month__name">{MONTH_SHORT[i]}</span>
                  </>
                );
                return count > 0 ? (
                  <a
                    key={month}
                    href={`#ay-${month}`}
                    className={cls}
                    aria-current={month === thisMonth ? "date" : undefined}
                    aria-label={`${monthName(month)}: ${count} doğum günü`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div
                    key={month}
                    className={cls}
                    role="img"
                    aria-label={`${monthName(month)}: doğum günü yok`}
                  >
                    {inner}
                  </div>
                );
              })}
            </nav>
          </section>

          <section className="shell section" aria-labelledby="liste">
            <h2 id="liste" className="sr-only">
              Yaklaşan doğum günleri
            </h2>
            {groups.map((g) => {
              const id = anchored.has(g.month) ? undefined : `ay-${g.month}`;
              anchored.add(g.month);
              return (
                <section key={g.key} id={id} className="month-group">
                  <div className="month-group__head">
                    <h3 className="month-group__title">
                      {monthName(g.month)}
                      {g.year !== thisYear ? ` ${g.year}` : ""}
                    </h3>
                    <span className="chip">{g.members.length} kişi</span>
                  </div>
                  <div className="bday-grid">
                    {g.members.map((m) => (
                      <BirthdayCard key={m.id} member={m} />
                    ))}
                  </div>
                </section>
              );
            })}
          </section>
        </>
      )}
    </>
  );
}
