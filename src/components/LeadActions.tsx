"use client";

import { useState, useTransition } from "react";
import { approveMember, deleteMember, type LeadActionResult } from "@/app/yonetim/actions";

/** Approve (while the registration is waiting) and delete, the latter behind a confirmation. */
export function LeadActions({ memberId, name, approved }: { memberId: string; name: string; approved: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  function run(action: (id: string) => Promise<LeadActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action(memberId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="lead-actions">
      {confirming ? (
        <>
          <span className="lead-actions-ask">{name} sistemden kalıcı olarak silinsin mi?</span>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(deleteMember)}>
            {busy ? "Siliniyor…" : "Evet, sil"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setConfirming(false)}>
            Vazgeç
          </button>
        </>
      ) : (
        <>
          {!approved && (
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(approveMember)}>
              {busy ? "Onaylanıyor…" : "Onayla"}
            </button>
          )}
          <button type="button" className="link-btn link-btn-quiet" disabled={busy} onClick={() => setConfirming(true)}>
            Sistemden sil
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="alert lead-actions-error">
          {error}
        </p>
      )}
    </div>
  );
}
