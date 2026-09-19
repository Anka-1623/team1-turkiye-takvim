import type { Metadata } from "next";
import { ManageForm } from "@/components/ManageForm";

export const metadata: Metadata = {
  title: "Kaydımı Yönet — Kozalak Takvim",
};

export default function KaydimPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-24 pt-14 sm:px-8 sm:pt-20">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">
        Kaydımı yönet
      </p>
      <h1 className="font-display mt-3 text-4xl font-extrabold text-[var(--color-fg)]">
        Bilgilerini düzenle
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">
        Kayıt olurken girdiğin Member Portal ID ile kendi kaydını bulup düzenleyebilir veya
        silebilirsin.
      </p>

      <div className="mt-9">
        <ManageForm />
      </div>
    </div>
  );
}
