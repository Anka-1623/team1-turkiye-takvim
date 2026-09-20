import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set (see .env.example)."
  );
}

/**
 * Browser client used by client components. Session is persisted in
 * cookies (via @supabase/ssr) so the server can read it too — this is what
 * makes magic-link login work across the callback redirect.
 */
export function createClient() {
  return createBrowserClient(url!, anonKey!);
}
