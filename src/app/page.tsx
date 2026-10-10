import Link from "next/link";
import type { CSSProperties } from "react";
import { BirthdayCard } from "@/components/BirthdayCard";
import { TodayBirthday } from "@/components/TodayBirthday";
import { daysUntilNextBirthday, istanbulToday, nextOccurrenceYear } from "@/lib/date";
import { fetchAllMembers } from "@/lib/digest";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

export const dynamic = "force-dynamic";

const MONTH_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const monthOf = (birthday: string) => Number(birthday.slice(5, 7));

const fullName = (m: Member) => `${m.first_name} ${m.last_name}`;

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

  const everyone = await fetchAllMembers();
  const members = everyone.filter((m) => m.id !== ownId);
  // On a birthday the hero names everyone born that day, the signed-in member included.
  const bornToday = everyone
    .filter((m) => daysUntilNextBirthday(m.birthday) === 0)
    .sort((a, b) => fullName(a).localeCompare(fullName(b), "tr"));
  const sorted = [...members].sort(
    (a, b) => daysUntilNextBirthday(a.birthday) - daysUntilNextBirthday(b.birthday)
  );

  // The hero slab only has something to say on a birthday, or while the calendar is still empty.
  const showSlab = bornToday.length > 0 || members.length === 0;

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
      <section className="shell pb-16 pt-10 md:pb-24 md:pt-14">
        <div className={showSlab ? "hero" : "hero hero-solo"}>
          <div className="hero-copy">
            <p className="rise text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Team1 Türkiye
            </p>
            <h1 className="hero-title rise" style={{ "--i": 1 } as CSSProperties}>
              Doğum Günü Takvimi
            </h1>
            <p className="hero-lead rise" style={{ "--i": 2 } as CSSProperties}>
              Üyelerin doğum günleri tek yerde. Kaydını ekle, yaklaşanları gör, kimseyi kutlamayı
              kaçırma.
            </p>
            {ownId === null && (
              <div className="rise" style={{ "--i": 3 } as CSSProperties}>
                <Link href="/kayit" className="btn btn-primary">
                  Doğum günümü ekle
                </Link>
              </div>
            )}
          </div>

          {showSlab && <TodayBirthday today={bornToday} signedInMember={ownId !== null} />}
        </div>
      </section>

      {members.length > 0 && (
        <>
          <section className="shell pb-16 md:pb-24" aria-labelledby="aylar">
            <h2 id="aylar" className="text-3xl md:text-4xl">
              Aylara göre
            </h2>
            <p className="mt-3 max-w-[48ch] text-ink-2">
              Toplam {members.length} üye. Bir aya dokun, o ayın doğum günlerine git.
            </p>

            <nav className="months mt-10" aria-label="Aylara göre doğum günü sayısı">
              {perMonth.map((count, i) => {
                const month = i + 1;
                const cls = [
                  "month",
                  month === thisMonth ? "month-now" : "",
                  count === 0 ? "month-empty" : "",
                ]
                  .join(" ")
                  .trim();
                const inner = (
                  <>
                    <span className="month-plot" aria-hidden="true">
                      <span
                        className="month-bar"
                        style={
                          {
                            height: count === 0 ? "2px" : `${Math.max(8, (count / maxPerMonth) * 100)}%`,
                            "--i": i,
                          } as CSSProperties
                        }
                      />
                    </span>
                    <span className="month-count">{count}</span>
                    <span className="month-name">{MONTH_SHORT[i]}</span>
                  </>
                );
                return count > 0 ? (
                  <a
                    key={month}
                    href={`#ay-${month}`}
                    className={cls}
                    aria-label={`${monthName(month)}: ${count} doğum günü`}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={month} className={cls} aria-label={`${monthName(month)}: doğum günü yok`}>
                    {inner}
                  </div>
                );
              })}
            </nav>
          </section>

          <section className="shell pb-8" aria-labelledby="liste">
            <h2 id="liste" className="sr-only">
              Yaklaşan doğum günleri
            </h2>
            <div className="space-y-16 md:space-y-20">
              {groups.map((g) => {
                const id = anchored.has(g.month) ? undefined : `ay-${g.month}`;
                anchored.add(g.month);
                return (
                  <section key={g.key} id={id} className="scroll-mt-24">
                    <h3 className="month-title">
                      <span>
                        {monthName(g.month)}
                        {g.year !== thisYear ? ` ${g.year}` : ""}
                      </span>
                      <span className="month-n">{g.members.length} kişi</span>
                    </h3>
                    <div>
                      {g.members.map((m) => (
                        <BirthdayCard key={m.id} member={m} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        </>
      )}
    </>
  );
}
