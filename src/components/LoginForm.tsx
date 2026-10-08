"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, expiredLink = false }: { next: string; expiredLink?: boolean }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    expiredLink ? "Giriş linki geçersiz ya da süresi dolmuş. Aşağıdan yeni bir link iste." : null
  );
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), next }),
      });
      if (res.status === 429) {
        setError("Çok sık denedin. Birkaç dakika sonra tekrar dene.");
        return;
      }
      if (res.status === 400) {
        setError("Geçerli bir e-posta adresi gir.");
        return;
      }
      if (res.status >= 500) {
        // Our own mail pipeline is unavailable: fall back to Supabase's built-in magic link.
        const { error: authError } = await createClient().auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (authError) {
          setError("Bir şeyler ters gitti, tekrar dener misin?");
          return;
        }
      }
      setSent(true);
    } catch {
      setError("Bağlantı kurulamadı, tekrar dener misin?");
    } finally {
      setSubmitting(false);
    }
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
