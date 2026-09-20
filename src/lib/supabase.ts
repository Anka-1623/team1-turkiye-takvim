import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example)."
  );
}

// This is the anon/publishable key on purpose — it is safe to ship in the
// client bundle. For anonymous, public reads only (dashboard, admin
// digest) — no session needed, so no cookie plumbing here. Login-aware
// reads/writes (register/manage forms) use @/lib/supabase/client instead,
// which persists the session via cookies. See supabase/schema.sql.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
