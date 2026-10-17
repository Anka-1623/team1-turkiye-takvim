-- Team1 Türkiye Doğum Günü Takvimi — canonical schema (current state).
-- Re-run this on a fresh project to reproduce it from scratch.
--
-- Design: ownership is a real Supabase Auth account (magic-link login),
-- enforced by RLS via auth.uid() — not by a shared secret in application
-- code. portal_id is entered at registration and checked against
-- portal_roster (the real members' Member Portal IDs, service-role only):
-- a listed ID is approved at once, any other registration waits with
-- approved = false, invisible to everyone but its owner, until the local
-- lead approves it in /yonetim. Rows created before login existed also
-- keep their portal_id so the owner can attach it to a real account once
-- via claim_legacy_member(). address is private to the member and the
-- lead. Because the anon key ships in the public client bundle, anon only
-- ever gets a column-restricted public SELECT (never portal_id, user_id,
-- address, approved or notify_opt_in) — everything else requires an
-- authenticated session tied to the row.

create extension if not exists pgcrypto;

-- Member Portal IDs of the real Team1 Türkiye members, lower-cased and trimmed. Only the
-- service-role client (lead panel) and the SECURITY DEFINER functions below read it; the IDs are
-- loaded by hand and are not kept in the (public) repo.
create table if not exists public.portal_roster (
  portal_id_key text primary key,
  created_at timestamptz not null default now(),
  constraint portal_roster_key_normalized check (portal_id_key = lower(trim(portal_id_key)))
);
alter table public.portal_roster enable row level security;
revoke all on public.portal_roster from anon, authenticated;

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
  wish text,
  note text,
  address text,
  approved boolean not null default false,
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
  constraint members_wish_len check (char_length(coalesce(wish, '')) <= 300),
  constraint members_note_len check (char_length(coalesce(note, '')) <= 500),
  constraint members_address_len check (char_length(coalesce(address, '')) <= 300)
);

alter table public.members enable row level security;
revoke all on public.members from anon, authenticated;

-- Public read of everything except portal_id/user_id/address/approved/notify_opt_in,
-- enforced at the column-grant level (not just by convention in app code). A registration
-- that is still waiting for the lead's approval is visible only to its owner.
create policy members_public_read
  on public.members
  for select
  to anon, authenticated
  using (approved or user_id = auth.uid());

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

grant select (id, first_name, last_name, birthday, socials, interests, wish, note, created_at)
  on public.members to anon, authenticated;
grant insert (user_id, portal_id, first_name, last_name, birthday, socials, interests, wish, note, address, notify_opt_in)
  on public.members to authenticated;
grant update (portal_id, first_name, last_name, birthday, socials, interests, wish, note, address, notify_opt_in)
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

-- Decides approval on the server so a client can never grant it to itself: insert is approved only
-- when the ID is on the roster; an ID added or fixed later can approve a waiting row, never revoke one,
-- and an ID that is already on the roster cannot be swapped for another.
create or replace function public._members_check_portal_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listed boolean;
begin
  if tg_op = 'INSERT' then
    new.approved := new.portal_id is not null
      and exists (select 1 from public.portal_roster r where r.portal_id_key = lower(trim(new.portal_id)));
    return new;
  end if;

  -- portal_id_key is generated, so it is not computed yet inside a BEFORE trigger: compare the raw value.
  if lower(trim(new.portal_id)) is distinct from old.portal_id_key then
    if old.portal_id is not null
       and exists (select 1 from public.portal_roster r where r.portal_id_key = old.portal_id_key) then
      raise exception 'PORTAL_ID_LOCKED';
    end if;
    select exists (select 1 from public.portal_roster r where r.portal_id_key = lower(trim(new.portal_id)))
      into v_listed;
    new.approved := old.approved or v_listed;
  end if;
  return new;
end;
$$;

drop trigger if exists members_check_portal_id_insert on public.members;
create trigger members_check_portal_id_insert
  before insert on public.members
  for each row execute function public._members_check_portal_id();

drop trigger if exists members_check_portal_id_update on public.members;
create trigger members_check_portal_id_update
  before update of portal_id on public.members
  for each row execute function public._members_check_portal_id();

-- Lets a member read their own private columns (notify_opt_in, address, portal_id, approval,
-- id for edit forms) without exposing them to anon/authenticated via a table-wide grant.
create or replace function public.get_my_member()
returns table (
  id uuid,
  first_name text,
  last_name text,
  birthday date,
  socials jsonb,
  interests text,
  wish text,
  note text,
  notify_opt_in boolean,
  address text,
  portal_id text,
  portal_verified boolean,
  approved boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select m.id, m.first_name, m.last_name, m.birthday, m.socials, m.interests, m.wish, m.note,
         m.notify_opt_in, m.address, m.portal_id,
         exists (select 1 from public.portal_roster r where r.portal_id_key = m.portal_id_key),
         m.approved
  from public.members m
  where m.user_id = auth.uid();
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

-- Dedup log for the 7/3/0-day opt-in reminder emails, keyed by the
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

-- Rate-limit log for the custom login e-mail route (/api/auth/login). Only
-- the server's service-role client touches it; no policies are granted on
-- purpose.
create table if not exists public.login_email_log (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  ip_hash text, -- salted hash of the caller's IP for the per-caller limit; purged with the row after 24h
  created_at timestamptz not null default now()
);
create index if not exists login_email_log_email_created_idx
  on public.login_email_log (email, created_at desc);
create index if not exists login_email_log_created_idx
  on public.login_email_log (created_at desc);
create index if not exists login_email_log_ip_created_idx
  on public.login_email_log (ip_hash, created_at desc);
alter table public.login_email_log enable row level security;
revoke all on public.login_email_log from anon, authenticated;
