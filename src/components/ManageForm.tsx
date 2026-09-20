"use client";

import { useState, type FormEvent } from "react";
import { SocialLinksEditor } from "@/components/SocialLinksEditor";
import { friendlyMemberError } from "@/lib/formErrors";
import { createClient } from "@/lib/supabase/client";
import type { EditableMember, MyMember } from "@/lib/types";

type Stage = "edit" | "confirm-delete" | "deleted";

export function ManageForm({ initial }: { initial: MyMember }) {
  const [stage, setStage] = useState<Stage>("edit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<EditableMember>({
    first_name: initial.first_name,
    last_name: initial.last_name,
    birthday: initial.birthday,
    socials: initial.socials,
    interests: initial.interests ?? "",
    note: initial.note ?? "",
    notify_opt_in: initial.notify_opt_in,
  });

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("members")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        birthday: form.birthday,
        socials: form.socials.filter((s) => s.url.trim().length > 0),
        interests: form.interests.trim() || null,
        note: form.note.trim() || null,
        notify_opt_in: form.notify_opt_in,
      })
      .eq("id", initial.id);

    setLoading(false);
    if (updateError) {
      setError(friendlyMemberError(updateError.message));
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDelete() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("members").delete().eq("id", initial.id);
    setLoading(false);
    if (deleteError) {
      setError(friendlyMemberError(deleteError.message));
      return;
    }
    setStage("deleted");
  }

  if (stage === "deleted") {
    return (
      <div className="rounded-2xl border border-white/[0.1] bg-[var(--color-bg-card)] p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Kayıt silindi</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Doğum günün panelden kaldırıldı. Tekrar eklemek istersen kayıt sayfasına dönebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">Ad</span>
            <input
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="field w-full"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">Soyad</span>
            <input
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="field w-full"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">Doğum günü</span>
          <input
            required
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="field w-full sm:w-56"
          />
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
            Sosyal medya bağlantıları
          </span>
          <SocialLinksEditor
            value={form.socials}
            onChange={(socials) => setForm({ ...form, socials })}
          />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
            İlgi alanları <span className="text-[var(--color-muted-2)]">(opsiyonel)</span>
          </span>
          <input
            maxLength={300}
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            className="field w-full"
            placeholder="Örn. kitap, satranç, blockchain, yürüyüş"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
            Not <span className="text-[var(--color-muted-2)]">(opsiyonel)</span>
          </span>
          <textarea
            maxLength={500}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={3}
            className="field w-full"
          />
        </label>

        <label className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
          <input
            type="checkbox"
            checked={form.notify_opt_in}
            onChange={(e) => setForm({ ...form, notify_opt_in: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            Diğer üyelerin doğum günü yaklaşınca (15/5/3 gün kala ve günü geldiğinde) bana e-posta
            ile hatırlat.
          </span>
        </label>

        {error && (
          <p className="rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] px-4 py-3 text-sm text-[var(--color-fg)]">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
          >
            {loading ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
          {saved && <span className="text-sm text-[var(--color-muted)]">Kaydedildi ✓</span>}
          <button
            type="button"
            onClick={() => setStage("confirm-delete")}
            className="ml-auto text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-brand)]"
          >
            Kaydı sil
          </button>
        </div>
      </form>

      {stage === "confirm-delete" && (
        <div className="rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] p-5">
          <p className="text-sm text-[var(--color-fg)]">
            Kaydını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
            >
              {loading ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              onClick={() => setStage("edit")}
              className="rounded-full border border-white/[0.12] px-5 py-2 text-sm font-semibold text-[var(--color-fg)] transition hover:border-white/[0.24]"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
