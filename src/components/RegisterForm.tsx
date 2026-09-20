"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SocialLinksEditor } from "@/components/SocialLinksEditor";
import { friendlyMemberError } from "@/lib/formErrors";
import { createClient } from "@/lib/supabase/client";
import type { SocialLink } from "@/lib/types";

export function RegisterForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([{ platform: "x", url: "" }]);
  const [interests, setInterests] = useState("");
  const [note, setNote] = useState("");
  const [notifyOptIn, setNotifyOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("members").insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      birthday,
      socials: socials.filter((s) => s.url.trim().length > 0),
      interests: interests.trim() || null,
      note: note.trim() || null,
      notify_opt_in: notifyOptIn,
    });

    setSubmitting(false);

    if (insertError) {
      setError(friendlyMemberError(insertError.message));
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Eklendi 🎉</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Doğum günün panelde görünüyor. Kaydını dilediğin zaman &apos;Kaydımı Yönet&apos;
          sayfasından düzenleyebilir veya silebilirsin.
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

      <div>
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
          Sosyal medya bağlantıları <span className="text-[var(--color-brand)]">*en az bir tane</span>
        </span>
        <SocialLinksEditor value={socials} onChange={setSocials} />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
          İlgi alanları <span className="text-[var(--color-muted-2)]">(opsiyonel)</span>
        </span>
        <input
          maxLength={300}
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          className="field w-full"
          placeholder="Örn. kitap, satranç, blockchain, yürüyüş"
        />
        <span className="mt-1.5 block text-xs text-[var(--color-muted-2)]">
          Diğer üyeler hediye/kutlama fikri bulabilsin diye panelde görünür.
        </span>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">
          Not <span className="text-[var(--color-muted-2)]">(opsiyonel)</span>
        </span>
        <textarea
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="field w-full"
          placeholder="Örn. bu yıl sürpriz istemiyorum, ya da bir dilek listesi bağlantısı"
        />
      </label>

      <label className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
        <input
          type="checkbox"
          checked={notifyOptIn}
          onChange={(e) => setNotifyOptIn(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Diğer üyelerin doğum günü yaklaşınca (15/5/3 gün kala ve günü geldiğinde) bana e-posta ile
          hatırlat.
        </span>
      </label>

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
