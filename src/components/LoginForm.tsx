"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setSubmitting(false);
    if (authError) {
      setError("Bir şeyler ters gitti, tekrar dener misin?");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg)]">Mailini kontrol et 📬</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          <strong className="text-[var(--color-fg)]">{email}</strong> adresine bir giriş linki gönderdik.
          Linke tıklayınca otomatik olarak giriş yapmış olacaksın.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-[var(--color-muted)]">E-posta</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field w-full sm:w-80"
          placeholder="ad.soyad@ornek.com"
        />
        <span className="mt-1.5 block text-xs text-[var(--color-muted-2)]">
          Şifre yok — mailine gelen linke tıklayarak giriş yaparsın.
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
        {submitting ? "Gönderiliyor…" : "Giriş linki gönder"}
      </button>
    </form>
  );
}
