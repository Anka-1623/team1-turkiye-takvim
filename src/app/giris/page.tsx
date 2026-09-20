import type { Metadata } from "next";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Giriş yap — Team1 Türkiye",
};

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        Giriş yap
      </p>
      <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
        Mailinle giriş yap
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        Doğum günü kaydını eklemek veya düzenlemek için giriş yapman gerekiyor — panel herkese
        açık kalıyor.
      </p>

      <div className="mt-9">
        <LoginForm next={next && next.startsWith("/") ? next : "/kaydim"} />
      </div>
    </div>
  );
}
