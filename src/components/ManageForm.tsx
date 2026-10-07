"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { CheckIcon } from "@/components/Icons";
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
      <div className="card result" role="status">
        <h2 className="card-title">Kayıt silindi</h2>
        <p className="muted">
          Doğum günün panelden kaldırıldı. Tekrar eklemek istersen kayıt sayfasına dönebilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <form onSubmit={handleSave} className="card stack">
        <div className="form-row">
          <label className="block">
            <span className="label">Ad</span>
            <input
              required
              autoComplete="given-name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="field"
            />
          </label>
          <label className="block">
            <span className="label">Soyad</span>
            <input
              required
              autoComplete="family-name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="field"
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
            value={form.birthday}
            onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            className="field field--short"
          />
        </label>

        <fieldset>
          <legend className="label">Sosyal medya bağlantıları</legend>
          <SocialLinksEditor value={form.socials} onChange={(socials) => setForm({ ...form, socials })} />
        </fieldset>

        <label className="block">
          <span className="label">
            İlgi alanları <span className="opt">(opsiyonel)</span>
          </span>
          <input
            maxLength={300}
            value={form.interests}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
            className="field"
            placeholder="Örn. kitap, satranç, blockchain, yürüyüş"
          />
        </label>

        <label className="block">
          <span className="label">
            Not <span className="opt">(opsiyonel)</span>
          </span>
          <textarea
            maxLength={500}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={3}
            className="field"
          />
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.notify_opt_in}
            onChange={(e) => setForm({ ...form, notify_opt_in: e.target.checked })}
          />
          <span>
            Doğum günü e-postaları: diğer üyelerin doğum günü yaklaşırken (7 ve 3 gün kala, bir de günü
            geldiğinde) hatırlatma, kendi doğum günümde de bir kutlama almak istiyorum.
          </span>
        </label>

        {error && <Alert>{error}</Alert>}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading} aria-busy={loading && stage === "edit"} className="btn btn-primary">
            {loading && stage === "edit" ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
          <span role="status" aria-live="polite">
            {saved && (
              <span className="status">
                <CheckIcon size={18} />
                Kaydedildi
              </span>
            )}
          </span>
          <button type="button" onClick={() => setStage("confirm-delete")} className="link-btn ml-auto">
            Kaydı sil
          </button>
        </div>
      </form>

      {stage === "confirm-delete" && (
        <div className="card card--signal result" role="alertdialog" aria-labelledby="sil-baslik">
          <h2 id="sil-baslik" className="card-title">
            Kaydı silmek istiyor musun?
          </h2>
          <p className="muted">Kaydın kalıcı olarak silinir. Bu işlem geri alınamaz.</p>
          <div className="result__actions">
            <button onClick={handleDelete} disabled={loading} aria-busy={loading} className="btn btn-danger">
              {loading ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button onClick={() => setStage("edit")} className="btn btn-secondary">
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
