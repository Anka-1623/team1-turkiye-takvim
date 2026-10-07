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
      <div className="panel panel-accent">
        <h2 className="text-3xl">Mailini kontrol et</h2>
        <p className="mt-2 text-sm text-ink-2">
          <strong className="text-ink">{email}</strong> adresine bir giriş linki gönderdik.
          Linke tıklayınca otomatik olarak giriş yapmış olacaksın.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="label">E-posta</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field w-full sm:w-80"
          placeholder="ad.soyad@ornek.com"
        />
        <span className="help">
          Şifre yok: mailine gelen linke tıklayarak giriş yaparsın.
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
        {submitting ? "Gönderiliyor…" : "Giriş linki gönder"}
      </button>
    </form>
  );
}
