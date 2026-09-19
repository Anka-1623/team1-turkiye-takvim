import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example)."
  );
}

// This is the anon/publishable key on purpose — it is safe to ship in the
// client bundle. The `members` table has no policies granting it direct
// row access; every read goes through a column-restricted RLS policy (no
// portal_id column) and every write goes through SECURITY DEFINER RPCs
// that check the caller's portal_id inside Postgres. See supabase/schema.sql.
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
