import Image from "next/image";
import Link from "next/link";
import { NavLink } from "@/components/NavLink";
import { SignOutButton } from "@/components/SignOutButton";
import { createClient } from "@/lib/supabase/server";

export async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper">
      <div className="shell flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/brand/team1-turkiye-wordmark.png"
            alt="Team1 Türkiye"
            width={136}
            height={20}
            priority
            className="h-[15px] w-auto sm:h-[18px]"
          />
        </Link>
        <nav className="flex items-center" aria-label="Ana menü">
          <NavLink href="/" className="hidden sm:inline-flex">
            Panel
          </NavLink>
          <NavLink href="/kaydim">
            <span className="sm:hidden">Kaydım</span>
            <span className="hidden sm:inline">Kaydımı Yönet</span>
          </NavLink>
          {user ? (
            <SignOutButton />
          ) : (
            <Link href="/giris?next=/kayit" className="btn btn-primary btn-sm ml-2">
              Giriş yap
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
