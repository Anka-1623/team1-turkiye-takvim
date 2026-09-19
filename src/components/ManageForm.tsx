"use client";

import { useState, type FormEvent } from "react";
import { SocialLinksEditor } from "@/components/SocialLinksEditor";
import { supabase } from "@/lib/supabase";
import type { EditableMember, SocialLink } from "@/lib/types";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Bu Member Portal ID ile kayıtlı bir profil bulunamadı.",
  INVALID_FIRST_NAME: "Ad alanı boş olamaz.",
  INVALID_LAST_NAME: "Soyad alanı boş olamaz.",
  INVALID_BIRTHDAY: "Doğum günü geçersiz. Gelecekte bir tarih olamaz.",
  SOCIALS_REQUIRED: "En az bir sosyal medya bağlantısı gerekli.",
  INVALID_SOCIALS: "Sosyal medya bağlantılarından biri geçersiz (http:// veya https:// ile başlamalı).",
  TOO_MANY_SOCIALS: "En fazla 8 sosyal medya bağlantısı ekleyebilirsin.",
};

function friendlyError(message: string): string {
  const code = Object.keys(ERROR_MESSAGES).find((k) => message.includes(k));
  return code ? ERROR_MESSAGES[code] : "Bir şeyler ters gitti, tekrar dener misin?";
}

type Stage = "lookup" | "edit" | "confirm-delete" | "deleted";

export function ManageForm() {
  const [portalId, setPortalId] = useState("");
  const [stage, setStage] = useState<Stage>("lookup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<EditableMember | null>(null);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("lookup_member", {
      p_portal_id: portalId.trim(),
    });
    setLoading(false);
    if (rpcError) {
      setError(friendlyError(rpcError.message));
      return;
    }
    const row = data?.[0];
    if (!row) {
      setError(friendlyError("NOT_FOUND"));
      return;
    }
    setForm({
      first_name: row.first_name,
      last_name: row.last_name,
      birthday: row.birthday,
      socials: (row.socials ?? []) as SocialLink[],
    });
    setStage("edit");
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    setLoading(true);
    const { error: rpcError } = await supabase.rpc("update_member", {
      p_portal_id: portalId.trim(),
      p_first_name: form.first_name.trim(),
      p_last_name: form.last_name.trim(),
      p_birthday: form.birthday,
      p_socials: form.socials.filter((s) => s.url.trim().length > 0),
    });
    setLoading(false);
    if (rpcError) {
      setError(friendlyError(rpcError.message));
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleDelete() {
    setError(null);
    setLoading(true);
    const { error: rpcError } = await supabase.rpc("delete_member", {
      p_portal_id: portalId.trim(),
    });
    setLoading(false);
    if (rpcError) {
      setError(friendlyError(rpcError.message));
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

  if (stage === "lookup") {
    return (
      <form onSubmit={handleLookup} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
            Member Portal ID
          </span>
          <input
            required
            value={portalId}
            onChange={(e) => setPortalId(e.target.value)}
            className="field w-full sm:w-80"
            placeholder="Kayıt olurken kullandığın ID"
          />
        </label>
        {error && (
          <p className="rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] px-4 py-3 text-sm text-[var(--color-fg)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
        >
          {loading ? "Aranıyor…" : "Kaydımı getir"}
        </button>
      </form>
    );
  }

  if (!form) return null;

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
