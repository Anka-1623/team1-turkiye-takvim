import type { Metadata } from "next";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Kaydol — Kozalak Takvim",
};

export default function KayitPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        Yeni kayıt
      </p>
      <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
        Doğum gününü ekle
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        Bilgilerin Team1 Türkiye üyelerine açık şekilde panelde görünür. Member Portal ID&apos;in
        sadece kaydını sonradan düzenlemek/silmek için kullanılır.
      </p>

      <div className="mt-9">
        <RegisterForm />
      </div>
    </div>
  );
}
