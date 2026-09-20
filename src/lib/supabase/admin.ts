import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely and can read auth.users
 * emails via the Admin API. Server-only: imported exclusively by the cron
 * route, never by client components. Missing key degrades the caller's
 * feature gracefully rather than throwing at module load, since the rest
 * of the app must keep working without it.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
