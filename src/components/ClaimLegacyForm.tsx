"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Bu Member Portal ID'ye ait, henüz kimseye bağlanmamış bir kayıt bulunamadı.",
  ALREADY_HAS_MEMBER: "Zaten bu hesaba bağlı bir kaydın var.",
  NOT_AUTHENTICATED: "Önce giriş yapmalısın.",
};

function friendlyError(message: string): string {
  const code = Object.keys(ERROR_MESSAGES).find((k) => message.includes(k));
  return code ? ERROR_MESSAGES[code] : "Bir şeyler ters gitti, tekrar dener misin?";
}

/** Lets a member who registered before login existed attach their old row to the account they just logged into. */
export function ClaimLegacyForm() {
  const router = useRouter();
  const [portalId, setPortalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("claim_legacy_member", {
      p_portal_id: portalId.trim(),
    });

    setLoading(false);
    if (rpcError) {
      setError(friendlyError(rpcError.message));
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-[var(--color-bg-card)] p-6">
      <h2 className="font-display text-xl font-bold text-[var(--color-fg)]">Henüz bir kaydın yok</h2>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Daha önce Member Portal ID ile kaydolduysan, o ID&apos;yi girerek kaydını bu hesaba
        bağlayabilirsin.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          required
          value={portalId}
          onChange={(e) => setPortalId(e.target.value)}
          className="field w-full sm:w-72"
          placeholder="Eski Member Portal ID'in"
        />
        {error && (
          <p className="rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand-soft)] px-4 py-3 text-sm text-[var(--color-fg)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-[var(--color-brand)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-strong)] disabled:opacity-50"
        >
          {loading ? "Bağlanıyor…" : "Kaydımı bağla"}
        </button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        Hiç kaydolmadıysan{" "}
        <Link href="/kayit" className="text-[var(--color-brand)] underline underline-offset-2">
          buradan yeni kayıt oluşturabilirsin
        </Link>
        .
      </p>
    </div>
  );
}
