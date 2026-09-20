import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/RegisterForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Kaydol — Team1 Türkiye",
};

export default async function KayitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          Yeni kayıt
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
          Önce giriş yapmalısın
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          Doğum günü kaydı eklemek için mailinle giriş yapman gerekiyor.
        </p>
        <Link
          href="/giris?next=/kayit"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  const { data: existing } = await supabase.rpc("get_my_member");
  if (existing && existing.length > 0) {
    redirect("/kaydim");
  }

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        Yeni kayıt
      </p>
      <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
        Doğum gününü ekle
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        Bilgilerin Team1 Türkiye üyelerine açık şekilde panelde görünür. Daha önce Member Portal
        ID ile kaydolduysan, tekrar kayıt olmak yerine{" "}
        <Link href="/kaydim" className="text-[var(--color-brand)] underline underline-offset-2">
          Kaydımı Yönet
        </Link>{" "}
        sayfasından eski kaydını bağlayabilirsin.
      </p>

      <div className="mt-9">
        <RegisterForm />
      </div>
    </div>
  );
}
