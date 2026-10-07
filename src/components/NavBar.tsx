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
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link href="/" className="brand-link">
          <span className="sr-only">Team1 Türkiye Doğum Günü Takvimi, ana sayfa</span>
          <Image
            src="/brand/team1/team1turkiye.svg"
            alt=""
            width={1727}
            height={257}
            priority
            className="logo logo--chapter"
          />
        </Link>
        <nav className="nav" aria-label="Ana menü">
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
            <Link href="/giris?next=/kayit" className="btn btn-primary btn-sm">
              Giriş yap
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
