-- Kozalak Takvim — canonical schema (current state, applied to the live
-- Supabase project via two migrations). Re-run this on a fresh project to
-- reproduce it from scratch.
--
-- Design: portal_id is the only "ownership" credential a member has (no real
-- auth). Because the anon key ships in the public client bundle, the base
-- table denies anon/authenticated everything except a column-restricted
-- SELECT (no portal_id column exposed), and every write goes through a
-- SECURITY DEFINER RPC that checks the caller's portal_id inside Postgres —
-- so even a request crafted by hand against the REST API can't read or
-- touch a row without already knowing its portal_id.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  portal_id text not null,
  portal_id_key text generated always as (lower(trim(portal_id))) stored,
  first_name text not null,
  last_name text not null,
  birthday date not null,
  socials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_portal_id_key_unique unique (portal_id_key),
  constraint members_first_name_len check (char_length(trim(first_name)) between 1 and 60),
  constraint members_last_name_len check (char_length(trim(last_name)) between 1 and 60),
  constraint members_portal_id_len check (char_length(trim(portal_id)) between 2 and 80),
  constraint members_birthday_range check (birthday > date '1900-01-01' and birthday <= current_date),
  constraint members_socials_is_array check (jsonb_typeof(socials) = 'array')
);

alter table public.members enable row level security;
revoke all on public.members from anon, authenticated;

-- Public read of everything except portal_id, enforced at the column-grant
-- level (not just by convention in application code).
create policy members_public_read
  on public.members
  for select
  to anon, authenticated
  using (true);

grant usage on schema public to anon, authenticated;
grant select (id, first_name, last_name, birthday, socials, created_at)
  on public.members to anon, authenticated;

create or replace function public._validate_socials(p_socials jsonb)
returns void
language plpgsql
set search_path = public
as $$
declare
  item jsonb;
begin
  if jsonb_typeof(p_socials) is distinct from 'array' then
    raise exception 'INVALID_SOCIALS';
  end if;
  if jsonb_array_length(p_socials) < 1 then
    raise exception 'SOCIALS_REQUIRED';
  end if;
  if jsonb_array_length(p_socials) > 8 then
    raise exception 'TOO_MANY_SOCIALS';
  end if;
  for item in select * from jsonb_array_elements(p_socials)
  loop
    if not (item ? 'platform') or not (item ? 'url') then
      raise exception 'INVALID_SOCIALS';
    end if;
    if length(trim(item->>'platform')) < 1 or length(trim(item->>'platform')) > 30 then
      raise exception 'INVALID_SOCIALS';
    end if;
    if length(item->>'url') > 300 or (item->>'url') !~* '^https?://' then
      raise exception 'INVALID_SOCIALS';
    end if;
  end loop;
end;
$$;

create or replace function public.create_member(
  p_portal_id text,
  p_first_name text,
  p_last_name text,
  p_birthday date,
  p_socials jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if length(trim(coalesce(p_portal_id, ''))) not between 2 and 80 then
    raise exception 'INVALID_PORTAL_ID';
  end if;
  if length(trim(coalesce(p_first_name, ''))) < 1 then
    raise exception 'INVALID_FIRST_NAME';
  end if;
  if length(trim(coalesce(p_last_name, ''))) < 1 then
    raise exception 'INVALID_LAST_NAME';
  end if;
  if p_birthday is null or p_birthday > current_date or p_birthday < date '1900-01-01' then
    raise exception 'INVALID_BIRTHDAY';
  end if;
  perform public._validate_socials(p_socials);

  if exists (select 1 from public.members where portal_id_key = lower(trim(p_portal_id))) then
    raise exception 'PORTAL_ID_TAKEN';
  end if;

  insert into public.members (portal_id, first_name, last_name, birthday, socials)
  values (trim(p_portal_id), trim(p_first_name), trim(p_last_name), p_birthday, p_socials)
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.lookup_member(p_portal_id text)
returns table (
  first_name text,
  last_name text,
  birthday date,
  socials jsonb
)
language sql
security definer
set search_path = public
as $$
  select first_name, last_name, birthday, socials
  from public.members
  where portal_id_key = lower(trim(p_portal_id));
$$;

create or replace function public.update_member(
  p_portal_id text,
  p_first_name text,
  p_last_name text,
  p_birthday date,
  p_socials jsonb
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if length(trim(coalesce(p_first_name, ''))) < 1 then
    raise exception 'INVALID_FIRST_NAME';
  end if;
  if length(trim(coalesce(p_last_name, ''))) < 1 then
    raise exception 'INVALID_LAST_NAME';
  end if;
  if p_birthday is null or p_birthday > current_date or p_birthday < date '1900-01-01' then
    raise exception 'INVALID_BIRTHDAY';
  end if;
  perform public._validate_socials(p_socials);

  update public.members
  set first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      birthday = p_birthday,
      socials = p_socials,
      updated_at = now()
  where portal_id_key = lower(trim(p_portal_id));

  get diagnostics v_updated = row_count;
  if v_updated = 0 then
    raise exception 'NOT_FOUND';
  end if;
  return true;
end;
$$;

create or replace function public.delete_member(p_portal_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.members where portal_id_key = lower(trim(p_portal_id));
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then
    raise exception 'NOT_FOUND';
  end if;
  return true;
end;
$$;

revoke all on function public.create_member(text, text, text, date, jsonb) from public;
revoke all on function public.lookup_member(text) from public;
revoke all on function public.update_member(text, text, text, date, jsonb) from public;
revoke all on function public.delete_member(text) from public;
revoke all on function public._validate_socials(jsonb) from public;

grant execute on function public.create_member(text, text, text, date, jsonb) to anon, authenticated;
grant execute on function public.lookup_member(text) to anon, authenticated;
grant execute on function public.update_member(text, text, text, date, jsonb) to anon, authenticated;
grant execute on function public.delete_member(text) to anon, authenticated;
