"use client";

import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
import { CheckIcon } from "@/components/Icons";
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
      <div className="card card--signal result" role="status">
        <span className="card__icon">
          <CheckIcon size={24} />
        </span>
        <h2 className="card-title">Mailini kontrol et</h2>
        <p className="muted">
          <strong>{email}</strong> adresine bir giriş linki gönderdik. Linke tıklayınca otomatik olarak giriş
          yapmış olacaksın.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card stack">
      <label className="block">
        <span className="label">E-posta</span>
        <input
          required
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          placeholder="ad.soyad@ornek.com"
        />
        <span className="help">Şifre yok: mailine gelen linke tıklayarak giriş yaparsın.</span>
      </label>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} aria-busy={submitting} className="btn btn-primary">
          {submitting ? "Gönderiliyor…" : "Giriş linki gönder"}
        </button>
      </div>
    </form>
  );
}
