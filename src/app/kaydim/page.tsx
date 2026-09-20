import type { Metadata } from "next";
import Link from "next/link";
import { ClaimLegacyForm } from "@/components/ClaimLegacyForm";
import { ManageForm } from "@/components/ManageForm";
import { createClient } from "@/lib/supabase/server";
import type { MyMember } from "@/lib/types";

export const metadata: Metadata = {
  title: "Kaydımı Yönet — Team1 Türkiye",
};

export default async function KaydimPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
          Kaydımı yönet
        </p>
        <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
          Önce giriş yapmalısın
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
          Kaydını düzenlemek veya silmek için mailinle giriş yapman gerekiyor.
        </p>
        <Link
          href="/giris?next=/kaydim"
          className="mt-6 inline-block rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
        >
          Giriş yap
        </Link>
      </div>
    );
  }

  const { data } = await supabase.rpc("get_my_member");
  const member = (data?.[0] ?? null) as MyMember | null;

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        Kaydımı yönet
      </p>
      <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
        Bilgilerini düzenle
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        Giriş yaptığın hesaba bağlı kaydını burada düzenleyebilir veya silebilirsin.
      </p>

      <div className="mt-9">{member ? <ManageForm initial={member} /> : <ClaimLegacyForm />}</div>
    </div>
  );
}
