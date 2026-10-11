-- Adds members.wish ("Doğum gününde istediği bir şey"), separate from interests.
-- Additive: the previous app version keeps working with the column in place, so run
-- this in the Supabase SQL Editor BEFORE deploying the code that reads `wish`.
-- supabase/schema.sql already contains the same definitions for fresh installs.

alter table public.members add column if not exists wish text;
alter table public.members
  add constraint members_wish_len check (char_length(coalesce(wish, '')) <= 300);

grant select (wish) on public.members to anon, authenticated;
grant insert (wish) on public.members to authenticated;
grant update (wish) on public.members to authenticated;

-- A RETURNS TABLE signature cannot change in place, so the function is recreated
-- (one transaction, same grants as before).
begin;
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
  notify_opt_in boolean
)
language sql
security definer
stable
set search_path = public
as $$
  select id, first_name, last_name, birthday, socials, interests, wish, note, notify_opt_in
  from public.members
  where user_id = auth.uid();
$$;

revoke all on function public.get_my_member() from public;
revoke execute on function public.get_my_member() from anon;
grant execute on function public.get_my_member() to authenticated;
commit;
