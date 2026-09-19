"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SocialLinksEditor } from "@/components/SocialLinksEditor";
import { supabase } from "@/lib/supabase";
import type { SocialLink } from "@/lib/types";

const ERROR_MESSAGES: Record<string, string> = {
  PORTAL_ID_TAKEN:
    "Bu Member Portal ID zaten kayıtlı. Daha önce eklediysen 'Kaydımı Yönet' sayfasından düzenleyebilirsin.",
  INVALID_PORTAL_ID: "Member Portal ID en az 2 karakter olmalı.",
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

export function RegisterForm() {
  const [portalId, setPortalId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([{ platform: "x", url: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const cleanSocials = socials.filter((s) => s.url.trim().length > 0);

    const { error: rpcError } = await supabase.rpc("create_member", {
      p_portal_id: portalId.trim(),
      p_first_name: firstName.trim(),
      p_last_name: lastName.trim(),
      p_birthday: birthday,
      p_socials: cleanSocials,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(friendlyError(rpcError.message));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Eklendi 🎉</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Doğum günün panelde görünüyor. Kaydını Member Portal ID&apos;in ile daha sonra
          düzenleyebilir veya silebilirsin — ID&apos;ini bir yere not et.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)]"
        >
          Panele dön
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">Ad</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="field w-full"
            placeholder="Emirhan"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">Soyad</span>
          <input
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="field w-full"
            placeholder="Solmaz"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">Doğum günü</span>
        <input
          required
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="field w-full sm:w-56"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
          Member Portal ID <span className="text-[var(--color-brand)]">*zorunlu</span>
        </span>
        <input
          required
          minLength={2}
          value={portalId}
          onChange={(e) => setPortalId(e.target.value)}
          className="field w-full sm:w-72"
          placeholder="Team1 member portal ID'in"
        />
        <span className="mt-1.5 block text-xs text-[var(--color-muted-2)]">
          Kaydını sonradan düzenlemek veya silmek için bu ID&apos;yi tekrar gireceksin — not al.
        </span>
      </label>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
          Sosyal medya bağlantıları <span className="text-[var(--color-brand)]">*en az bir tane</span>
        </span>
        <SocialLinksEditor value={socials} onChange={setSocials} />
      </div>

      {error && (
        <p className="rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] px-4 py-3 text-sm text-[var(--color-fg)]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-[var(--color-brand)] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
      >
        {submitting ? "Ekleniyor…" : "Doğum günümü ekle"}
      </button>
    </form>
  );
}
