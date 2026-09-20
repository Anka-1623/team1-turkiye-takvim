-- Team1 Türkiye Doğum Günü Takvimi — canonical schema (current state).
-- Re-run this on a fresh project to reproduce it from scratch.
--
-- Design: ownership is a real Supabase Auth account (magic-link login),
-- enforced by RLS via auth.uid() — not by a shared secret in application
-- code. portal_id is legacy-only: rows created before login existed keep
-- it so their owner can attach it to a real account once via
-- claim_legacy_member(); new rows never set it. Because the anon key
-- ships in the public client bundle, anon only ever gets a column-
-- restricted public SELECT (never portal_id, user_id, or notify_opt_in) —
-- everything else requires an authenticated session tied to the row.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade default auth.uid(),
  portal_id text,
  portal_id_key text generated always as (lower(trim(portal_id))) stored,
  first_name text not null,
  last_name text not null,
  birthday date not null,
  socials jsonb not null default '[]'::jsonb,
  interests text,
  note text,
  notify_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_portal_id_key_unique unique (portal_id_key),
  constraint members_first_name_len check (char_length(trim(first_name)) between 1 and 60),
  constraint members_last_name_len check (char_length(trim(last_name)) between 1 and 60),
  constraint members_portal_id_len
    check (portal_id is null or char_length(trim(portal_id)) between 2 and 80),
  constraint members_birthday_range check (birthday > date '1900-01-01' and birthday <= current_date),
  constraint members_interests_len check (char_length(coalesce(interests, '')) <= 300),
  constraint members_note_len check (char_length(coalesce(note, '')) <= 500)
);

alter table public.members enable row level security;
revoke all on public.members from anon, authenticated;

-- Public read of everything except portal_id/user_id/notify_opt_in,
-- enforced at the column-grant level (not just by convention in app code).
create policy members_public_read
  on public.members
  for select
  to anon, authenticated
  using (true);

-- A member manages exactly one row: their own, matched by user_id.
create policy members_owner_insert
  on public.members for insert to authenticated
  with check (user_id = auth.uid());

create policy members_owner_update
  on public.members for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy members_owner_delete
  on public.members for delete to authenticated
  using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;

grant select (id, first_name, last_name, birthday, socials, interests, note, created_at)
  on public.members to anon, authenticated;
grant insert (user_id, first_name, last_name, birthday, socials, interests, note, notify_opt_in)
  on public.members to authenticated;
grant update (first_name, last_name, birthday, socials, interests, note, notify_opt_in)
  on public.members to authenticated;
grant delete on public.members to authenticated;

-- Boolean validator (usable directly in a CHECK constraint) for the
-- socials jsonb shape: an array of 1-8 { platform, url } objects.
create or replace function public._socials_valid(p_socials jsonb)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  item jsonb;
begin
  if jsonb_typeof(p_socials) is distinct from 'array' then
    return false;
  end if;
  if jsonb_array_length(p_socials) < 1 or jsonb_array_length(p_socials) > 8 then
    return false;
  end if;
  for item in select * from jsonb_array_elements(p_socials)
  loop
    if not (item ? 'platform') or not (item ? 'url') then
      return false;
    end if;
    if length(trim(item->>'platform')) < 1 or length(trim(item->>'platform')) > 30 then
      return false;
    end if;
    if length(item->>'url') > 300 or (item->>'url') !~* '^https?://' then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

alter table public.members
  add constraint members_socials_valid check (public._socials_valid(socials));

-- Lets a member read their own private columns (notify_opt_in, id for
-- edit forms) without exposing those columns to anon/authenticated via a
-- table-wide grant.
create or replace function public.get_my_member()
returns table (
  id uuid,
  first_name text,
  last_name text,
  birthday date,
  socials jsonb,
  interests text,
  note text,
  notify_opt_in boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select id, first_name, last_name, birthday, socials, interests, note, notify_opt_in
  from public.members
  where user_id = auth.uid();
$$;

revoke all on function public.get_my_member() from public;
revoke execute on function public.get_my_member() from anon;
grant execute on function public.get_my_member() to authenticated;

-- One-time bridge for members who registered before login existed: attach
-- their old row to their newly authenticated account via the portal ID
-- they already know. Portal ID stops mattering for them afterward.
create or replace function public.claim_legacy_member(p_portal_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if exists (select 1 from public.members where user_id = auth.uid()) then
    raise exception 'ALREADY_HAS_MEMBER';
  end if;
  update public.members
  set user_id = auth.uid(), updated_at = now()
  where portal_id_key = lower(trim(p_portal_id)) and user_id is null;

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'NOT_FOUND';
  end if;
  return true;
end;
$$;

revoke all on function public.claim_legacy_member(text) from public;
revoke execute on function public.claim_legacy_member(text) from anon;
grant execute on function public.claim_legacy_member(text) to authenticated;

-- Dedup log for the 15/5/3/0-day opt-in reminder emails, keyed by the
-- calendar year of the occurrence being notified about (so it resets
-- every year). Only the cron's service-role client (which bypasses RLS)
-- ever touches this table — no policies are granted on purpose.
create table if not exists public.birthday_notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  milestone integer not null,
  occurrence_year integer not null,
  sent_at timestamptz not null default now(),
  constraint birthday_notifications_unique unique (member_id, milestone, occurrence_year)
);
alter table public.birthday_notifications enable row level security;
revoke all on public.birthday_notifications from anon, authenticated;
