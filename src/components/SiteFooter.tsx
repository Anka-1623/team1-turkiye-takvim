import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-line">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex items-start gap-4">
          <Image
            src="/brand/avalanche-triangle.png"
            alt=""
            width={28}
            height={25}
            className="mt-0.5 h-6 w-auto shrink-0"
          />
          <p className="max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink-2">
            Avalanche Team1 Türkiye topluluğu için, üyeler tarafından yapıldı.
          </p>
        </div>
        <nav aria-label="Alt menü" className="flex flex-wrap gap-x-7 gap-y-2 text-[0.9375rem]">
          <Link href="/" className="py-1 text-ink-2 transition-colors hover:text-ink">
            Panel
          </Link>
          <Link href="/kaydim" className="py-1 text-ink-2 transition-colors hover:text-ink">
            Kaydımı Yönet
          </Link>
          <a
            href="https://github.com/Anka-1623/team1-turkiye-takvim"
            className="py-1 text-ink-2 transition-colors hover:text-ink"
          >
            Kaynak kod ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
