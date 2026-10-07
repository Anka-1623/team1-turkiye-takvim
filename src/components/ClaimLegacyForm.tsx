"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert";
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
    <div className="card stack">
      <div>
        <h2 className="card-title">Henüz bir kaydın yok</h2>
        <p className="muted mt-3">
          Daha önce Member Portal ID ile kaydolduysan, o ID&apos;yi girerek kaydını bu hesaba bağlayabilirsin.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="stack">
        <label className="block">
          <span className="label">Member Portal ID</span>
          <input
            required
            value={portalId}
            onChange={(e) => setPortalId(e.target.value)}
            className="field"
            placeholder="Eski Member Portal ID'in"
          />
        </label>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading} aria-busy={loading} className="btn btn-primary">
            {loading ? "Bağlanıyor…" : "Kaydımı bağla"}
          </button>
        </div>
      </form>
      <p className="muted">
        Hiç kaydolmadıysan{" "}
        <Link href="/kayit" className="link">
          buradan yeni kayıt oluşturabilirsin
        </Link>
        .
      </p>
    </div>
  );
}
