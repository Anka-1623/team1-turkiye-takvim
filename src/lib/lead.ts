import type { User } from "@supabase/supabase-js";

/** Accounts allowed into /yonetim: the comma-separated LEAD_EMAILS env var (server-only). */
function leadEmails(): string[] {
  return (process.env.LEAD_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True for a signed-in account whose *confirmed* e-mail is on the LEAD_EMAILS list. The
 * confirmation check matters: login is by magic link, which proves the mailbox is theirs.
 */
export function isLeadUser(user: User | null): boolean {
  if (!user?.email || !user.email_confirmed_at) return false;
  return leadEmails().includes(user.email.trim().toLowerCase());
}
