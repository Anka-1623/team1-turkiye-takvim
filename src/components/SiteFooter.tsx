import Image from "next/image";
import Link from "next/link";
import { ArrowUpRightIcon } from "@/components/Icons";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div className="site-footer__about">
          <Image
            src="/brand/team1/team1turkiye.svg"
            alt="Team1 Türkiye"
            width={1727}
            height={257}
            className="logo logo--chapter"
          />
          <p>Team1 Türkiye topluluğu için, üyeler tarafından yapıldı.</p>
        </div>
        <nav aria-label="Alt menü" className="site-footer__nav">
          <Link href="/">Panel</Link>
          <Link href="/kaydim">Kaydımı Yönet</Link>
          <a href="https://github.com/Anka-1623/team1-turkiye-takvim" target="_blank" rel="noreferrer noopener">
            Kaynak kod
            <ArrowUpRightIcon size={14} />
            <span className="sr-only">(yeni sekmede açılır)</span>
          </a>
        </nav>
        <ThemeToggle />
      </div>
    </footer>
  );
}
