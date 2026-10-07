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
      <div className="panel">
        <h2 className="text-3xl">Kayıt silindi</h2>
        <p className="mt-2 text-sm text-ink-2">
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
            <span className="label">Ad</span>
            <input
              required
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="field w-full"
            />
          </label>
          <label className="block">
            <span className="label">Soyad</span>
            <input
              required
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="field w-full"
            />
          </label>
        </div>

        <label className="block">
          <span className="label">Doğum günü</span>
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
          <span className="label">
            Sosyal medya bağlantıları
          </span>
          <SocialLinksEditor
            value={form.socials}
            onChange={(socials) => setForm({ ...form, socials })}
          />
        </div>

        <label className="block">
          <span className="label">
            İlgi alanları <span className="text-ink-3">(opsiyonel)</span>
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
          <span className="label">
            Not <span className="text-ink-3">(opsiyonel)</span>
          </span>
          <textarea
            maxLength={500}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={3}
            className="field w-full"
          />
        </label>

        <label className="flex items-start gap-2.5 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={form.notify_opt_in}
            onChange={(e) => setForm({ ...form, notify_opt_in: e.target.checked })}
            className="mt-0.5"
          />
          <span>
            Diğer üyelerin doğum günü yaklaşınca (7 ve 3 gün kala, bir de günü geldiğinde) bana e-posta
            ile hatırlat.
          </span>
        </label>

        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? "Kaydediliyor…" : "Değişiklikleri kaydet"}
          </button>
          {saved && <span className="text-sm text-ink-2">Kaydedildi</span>}
          <button
            type="button"
            onClick={() => setStage("confirm-delete")}
            className="link-btn link-btn-quiet ml-auto"
          >
            Kaydı sil
          </button>
        </div>
      </form>

      {stage === "confirm-delete" && (
        <div className="panel panel-accent">
          <p className="text-sm text-ink">
            Kaydını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Siliniyor…" : "Evet, sil"}
            </button>
            <button
              onClick={() => setStage("edit")}
              className="btn btn-ghost"
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
