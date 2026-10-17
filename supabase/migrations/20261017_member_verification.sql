-- Member verification + lead-only address.
--
--  * portal_roster: the Member Portal IDs of the real Team1 Türkiye members (service-role only, so the
--    list never ships to a browser). The IDs are NOT kept in this repo, which is public; load them
--    with a one-off INSERT in the Supabase SQL Editor.
--  * members.portal_id: now entered at registration. A registration whose ID is on the roster is
--    approved on the spot; any other one waits (approved = false) and is hidden from the public
--    list and the reminder mails until the local lead approves it in /yonetim.
--  * members.address: optional, written by the member, readable only by the local lead (service
--    role) and by the member themself through get_my_member().
--
-- Everyone already in the table is approved by this migration, so the public list does not change on
-- the day it runs. Run it in the Supabase SQL Editor BEFORE deploying the code that uses it (the
-- old code keeps working with it in place). supabase/schema.sql has the same definitions.

begin;

create table if not exists public.portal_roster (
  portal_id_key text primary key,
  created_at timestamptz not null default now(),
  constraint portal_roster_key_normalized check (portal_id_key = lower(trim(portal_id_key)))
);
alter table public.portal_roster enable row level security;
revoke all on public.portal_roster from anon, authenticated;

alter table public.members add column if not exists address text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_address_len' and conrelid = 'public.members'::regclass
  ) then
    alter table public.members
      add constraint members_address_len check (char_length(coalesce(address, '')) <= 300);
  end if;

  -- Backfill only when the column is first created, so re-running this never approves a pending row.
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'members' and column_name = 'approved'
  ) then
    alter table public.members add column approved boolean not null default false;
    update public.members set approved = true;
  end if;
end $$;

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

-- Waiting registrations are invisible to everyone but their owner.
drop policy if exists members_public_read on public.members;
create policy members_public_read
  on public.members
  for select
  to anon, authenticated
  using (approved or user_id = auth.uid());

grant insert (portal_id, address) on public.members to authenticated;
grant update (portal_id, address) on public.members to authenticated;
-- address, portal_id and approved are deliberately NOT granted for select.

-- A member's own private view (now with the fields that are not publicly readable).
drop function if exists public.get_my_member();
create function public.get_my_member()
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

commit;
