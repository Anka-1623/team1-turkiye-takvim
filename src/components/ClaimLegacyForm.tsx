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
    <div className="panel">
      <h2 className="text-2xl">Henüz bir kaydın yok</h2>
      <p className="mt-2 text-sm text-ink-2">
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
          <p role="alert" className="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Bağlanıyor…" : "Kaydımı bağla"}
        </button>
      </form>
      <p className="mt-4 text-sm text-ink-2">
        Hiç kaydolmadıysan{" "}
        <Link href="/kayit" className="link">
          buradan yeni kayıt oluşturabilirsin
        </Link>
        .
      </p>
    </div>
  );
}
