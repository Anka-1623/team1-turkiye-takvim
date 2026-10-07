"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { CheckIcon } from "@/components/Icons";
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
      <div className="card card--signal result" role="status">
        <span className="card__icon">
          <CheckIcon size={24} />
        </span>
        <h2 className="card-title">Eklendi</h2>
        <p className="muted">
          Doğum günün panelde görünüyor. Kaydını dilediğin zaman &apos;Kaydımı Yönet&apos; sayfasından
          düzenleyebilir veya silebilirsin.
        </p>
        <div className="result__actions">
          <Link href="/" className="btn btn-primary">
            Panele dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <div className="form-row">
        <label className="block">
          <span className="label">Ad</span>
          <input
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="field"
            placeholder="Emirhan"
          />
        </label>
        <label className="block">
          <span className="label">Soyad</span>
          <input
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="field"
            placeholder="Solmaz"
          />
        </label>
      </div>

      <label className="block">
        <span className="label">Doğum günü</span>
        <input
          required
          type="date"
          autoComplete="bday"
          max={new Date().toISOString().slice(0, 10)}
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="field field--short"
        />
      </label>

      <fieldset>
        <legend className="label">
          Sosyal medya bağlantıları <span className="opt">en az bir tane gerekli</span>
        </legend>
        <SocialLinksEditor value={socials} onChange={setSocials} />
      </fieldset>

      <label className="block">
        <span className="label">
          İlgi alanları <span className="opt">(opsiyonel)</span>
        </span>
        <input
          maxLength={300}
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          className="field"
          placeholder="Örn. kitap, satranç, blockchain, yürüyüş"
        />
        <span className="help">Diğer üyeler hediye/kutlama fikri bulabilsin diye panelde görünür.</span>
      </label>

      <label className="block">
        <span className="label">
          Not <span className="opt">(opsiyonel)</span>
        </span>
        <textarea
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="field"
          placeholder="Örn. bu yıl sürpriz istemiyorum, ya da bir dilek listesi bağlantısı"
        />
      </label>

      <label className="check">
        <input type="checkbox" checked={notifyOptIn} onChange={(e) => setNotifyOptIn(e.target.checked)} />
        <span>
          Doğum günü e-postaları: diğer üyelerin doğum günü yaklaşırken (7 ve 3 gün kala, bir de günü
          geldiğinde) hatırlatma, kendi doğum günümde de bir kutlama almak istiyorum.
        </span>
      </label>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} aria-busy={submitting} className="btn btn-primary">
          {submitting ? "Ekleniyor…" : "Doğum günümü ekle"}
        </button>
      </div>
    </form>
  );
}
