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
  const [notifyOptIn, setNotifyOptIn] = useState(true);
  const [submitting, setSubmitting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(true);

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
      <div className="panel panel-accent">
        <h2 className="text-3xl">Eklendi</h2>
        <p className="mt-2 text-sm text-ink-2">
          Doğum günün panelde görünüyor. Kaydını dilediğin zaman &apos;Kaydımı Yönet&apos;
          sayfasından düzenleyebilir veya silebilirsin.
        </p>
        <Link
          href="/"
          className="btn btn-primary mt-6"
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
          <span className="label">Ad</span>
          <input
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="field w-full"
            placeholder="Emirhan"
          />
        </label>
        <label className="block">
          <span className="label">Soyad</span>
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
        <span className="label">Doğum günü</span>
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
        <span className="label">
          Sosyal medya bağlantıları <span className="text-accent">*en az bir tane</span>
        </span>
        <SocialLinksEditor value={socials} onChange={setSocials} />
      </div>

      <label className="block">
        <span className="label">
          İlgi alanları <span className="text-ink-3">(opsiyonel)</span>
        </span>
        <input
          maxLength={300}
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          className="field w-full"
          placeholder="Örn. kitap, satranç, blockchain, yürüyüş"
        />
        <span className="help">
          Diğer üyeler hediye/kutlama fikri bulabilsin diye panelde görünür.
        </span>
      </label>

      <label className="block">
        <span className="label">
          Not <span className="text-ink-3">(opsiyonel)</span>
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

      <label className="flex items-start gap-2.5 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={notifyOptIn}
          onChange={(e) => setNotifyOptIn(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Doğum günü e-postaları: diğer üyelerin doğum günü yaklaşırken (7 ve 3 gün kala, bir de günü geldiğinde) hatırlatma, kendi doğum günümde de bir kutlama almak istiyorum.
        </span>
      </label>

      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary"
      >
        {submitting ? "Ekleniyor…" : "Doğum günümü ekle"}
      </button>
    </form>
  );
}
