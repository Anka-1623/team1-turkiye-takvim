import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2 opacity-80">
          <Image src="/brand/avalanche-triangle.png" alt="" width={14} height={13} />
          <span className="text-xs text-[var(--color-muted)]">
            Avalanche Team1 Türkiye topluluğu için, üyeler tarafından
          </span>
        </div>
        <a
          href="https://github.com/Anka-1623/team1-turkiye-takvim"
          className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-fg)]"
        >
          Kaynak kod açık — katkı yapabilirsin
        </a>
      </div>
    </footer>
  );
}
