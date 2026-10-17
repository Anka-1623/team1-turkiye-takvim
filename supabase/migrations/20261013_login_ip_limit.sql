-- Per-caller rate limit for /api/auth/login: the route now stores a salted hash of the caller's IP
-- (never the address itself) next to the e-mail, and the 24h purge already in the route keeps it short-lived.
-- Additive only: the previous app version keeps working with the column in place, and the new code falls
-- back to logging without it, so the order doesn't matter much. Run it in the Supabase SQL Editor.
-- supabase/schema.sql already contains the same definitions for fresh installs.

alter table public.login_email_log add column if not exists ip_hash text;
create index if not exists login_email_log_ip_created_idx
  on public.login_email_log (ip_hash, created_at desc);
