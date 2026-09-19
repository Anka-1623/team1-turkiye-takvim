import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Panel" },
  { href: "/kaydim", label: "Kaydımı Yönet" },
];

export function NavBar() {
  return (
    <header className="relative z-20 border-b border-white/[0.08]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image src="/brand/avalanche-triangle.png" alt="" width={20} height={18} priority />
          <Image
            src="/brand/team1-turkiye-wordmark.png"
            alt="Team1 Türkiye"
            width={136}
            height={20}
            priority
            className="h-[18px] w-auto"
          />
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-fg)]"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/kayit"
            className="ml-1 rounded-full bg-[var(--color-brand)] px-4 py-1.5 font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
          >
            Kaydol
          </Link>
        </nav>
      </div>
    </header>
  );
}
