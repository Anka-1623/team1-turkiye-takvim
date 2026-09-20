"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="rounded-full px-3 py-1.5 text-[var(--color-muted)] transition hover:text-[var(--color-fg)] disabled:opacity-50"
    >
      {loading ? "Çıkış yapılıyor…" : "Çıkış yap"}
    </button>
  );
}
