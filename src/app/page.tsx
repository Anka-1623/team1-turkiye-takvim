import Link from "next/link";
import { BirthdayCard } from "@/components/BirthdayCard";
import { daysUntilNextBirthday } from "@/lib/date";
import { fetchAllMembers } from "@/lib/digest";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const members = await fetchAllMembers();
  const sorted = [...members].sort(
    (a, b) => daysUntilNextBirthday(a.birthday) - daysUntilNextBirthday(b.birthday)
  );
  const todayCount = sorted.filter((m) => daysUntilNextBirthday(m.birthday) === 0).length;

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <section className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          Team1 Türkiye
        </p>
        <h1 className="font-display mt-3 text-5xl font-extrabold leading-[0.95] text-[var(--color-fg)] sm:text-6xl">
          Kozalak Takvim
        </h1>
        <p className="mt-5 text-base leading-relaxed text-[var(--color-muted)]">
          Team1 Türkiye üyelerinin doğum günlerini tek yerde topluyoruz. Bilgini ekle, kimin
          doğum günü yaklaşıyor gör, sosyal medyasından kutlamayı unutma.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/kayit"
            className="rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
          >
            Doğum günümü ekle
          </Link>
          <Link
            href="/kaydim"
            className="rounded-full border border-white/[0.12] px-5 py-2.5 text-sm font-semibold text-[var(--color-fg)] transition hover:border-white/[0.24]"
          >
            Kaydımı yönet
          </Link>
        </div>
      </section>

      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">
            {todayCount > 0 ? "Bugün kutluyoruz 🎉" : "Yaklaşan doğum günleri"}
          </h2>
          <span className="text-sm text-[var(--color-muted)]">{sorted.length} üye</span>
        </div>

        {sorted.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-white/[0.12] p-10 text-center">
            <p className="text-[var(--color-muted)]">
              Henüz kimse eklenmedi. İlk doğum günü kaydını sen oluştur.
            </p>
            <Link
              href="/kayit"
              className="mt-4 inline-block rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
            >
              Doğum günümü ekle
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((m) => (
              <BirthdayCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
