-- Bridge the older public schema to the current Cinema application model.
-- Existing legacy tables are retained; the app-facing tables/columns are added
-- without deleting member records.

-- Profiles: preserve the existing id primary key and expose the app's user_id model.
alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists is_discoverable boolean not null default true;
update public.profiles
set user_id = id,
    username = coalesce(username, 'member_' || substr(replace(id::text, '-', ''), 1, 12)),
    display_name = coalesce(nullif(display_name, ''), 'Cinema Member'),
    bio = coalesce(bio, '');
alter table public.profiles alter column user_id set not null;
alter table public.profiles alter column username set not null;
alter table public.profiles alter column username set default ('member_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
alter table public.profiles alter column display_name set default 'Cinema Member';
alter table public.profiles alter column display_name set not null;
alter table public.profiles alter column bio set default '';
alter table public.profiles alter column bio set not null;
create unique index if not exists profiles_user_id_uidx on public.profiles(user_id);
create unique index if not exists profiles_username_uidx on public.profiles(username);
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_user_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (id, user_id, username, display_name, bio, is_discoverable)
  values (
    new.id,
    new.id,
    'member_' || substr(replace(new.id::text, '-', ''), 1, 12),
    coalesce(nullif(left(new.raw_user_meta_data ->> 'display_name', 60), ''), 'Cinema Member'),
    '',
    true
  )
  on conflict (id) do update
    set user_id = excluded.user_id,
        username = coalesce(public.profiles.username, excluded.username),
        display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
        bio = coalesce(public.profiles.bio, ''),
        is_discoverable = coalesce(public.profiles.is_discoverable, true);
  return new;
end;
$function$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "select_visible_profiles" on public.profiles;
drop policy if exists "insert_own_profile" on public.profiles;
drop policy if exists "update_own_profile" on public.profiles;
create policy "select_visible_profiles" on public.profiles
  for select to authenticated using (
    user_id = (select auth.uid())
    or is_discoverable
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = (select auth.uid()) and f.addressee_id = profiles.user_id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = profiles.user_id)
        )
    )
  );

-- Friendship graph.
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index if not exists friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_addressee_idx on public.friendships(addressee_id);
alter table public.friendships enable row level security;
grant select, delete on public.friendships to authenticated;
grant insert (requester_id, addressee_id, status) on public.friendships to authenticated;
grant update (status, updated_at) on public.friendships to authenticated;
drop policy if exists "select_own_friendships" on public.friendships;
create policy "select_own_friendships" on public.friendships for select to authenticated
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);
drop policy if exists "insert_friend_request" on public.friendships;
create policy "insert_friend_request" on public.friendships for insert to authenticated
  with check ((select auth.uid()) = requester_id and status = 'pending');
drop policy if exists "accept_friend_request" on public.friendships;
create policy "accept_friend_request" on public.friendships for update to authenticated
  using ((select auth.uid()) = addressee_id)
  with check ((select auth.uid()) = addressee_id and status = 'accepted');
drop policy if exists "delete_own_friendship" on public.friendships;
create policy "delete_own_friendship" on public.friendships for delete to authenticated
  using ((select auth.uid()) = requester_id or (select auth.uid()) = addressee_id);

-- Watchlist uses title IDs in the current application. Keep the legacy watchlist table.
create table if not exists public.watchlist_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, title_id)
);
alter table public.watchlist_items enable row level security;
grant select, insert, delete on public.watchlist_items to authenticated;
drop policy if exists "select_own_watchlist_items" on public.watchlist_items;
create policy "select_own_watchlist_items" on public.watchlist_items for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "insert_own_watchlist_items" on public.watchlist_items;
create policy "insert_own_watchlist_items" on public.watchlist_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "delete_own_watchlist_items" on public.watchlist_items;
create policy "delete_own_watchlist_items" on public.watchlist_items for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Upgrade favourites to the title-based application contract while retaining legacy content_id.
alter table public.favourites add column if not exists title_id uuid;
alter table public.favourites add column if not exists created_at timestamptz not null default now();
alter table public.favourites alter column user_id set default auth.uid();
alter table public.favourites alter column content_id drop not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.favourites'::regclass
      and conname = 'favourites_title_id_fkey'
  ) then
    alter table public.favourites add constraint favourites_title_id_fkey
      foreign key (title_id) references public.titles(id) on delete cascade;
  end if;
end $$;
alter table public.favourites drop constraint if exists favourites_pkey;
create unique index if not exists favourites_user_title_uidx on public.favourites(user_id, title_id);
alter table public.favourites enable row level security;
grant select, insert, update, delete on public.favourites to authenticated;
drop policy if exists "Users manage own favourites" on public.favourites;
drop policy if exists "select_own_favourites" on public.favourites;
drop policy if exists "insert_own_favourites" on public.favourites;
drop policy if exists "update_own_favourites" on public.favourites;
drop policy if exists "delete_own_favourites" on public.favourites;
create policy "select_own_favourites" on public.favourites for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert_own_favourites" on public.favourites for insert to authenticated
  with check ((select auth.uid()) = user_id and title_id is not null);
create policy "update_own_favourites" on public.favourites for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and title_id is not null);
create policy "delete_own_favourites" on public.favourites for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Upgrade watch progress to include the required title relationship.
alter table public.watch_progress add column if not exists title_id uuid;
update public.watch_progress set duration_seconds = 0 where duration_seconds is null;
alter table public.watch_progress alter column duration_seconds set default 0;
alter table public.watch_progress alter column duration_seconds set not null;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.watch_progress'::regclass
      and conname = 'watch_progress_title_id_fkey'
  ) then
    alter table public.watch_progress add constraint watch_progress_title_id_fkey
      foreign key (title_id) references public.titles(id) on delete cascade;
  end if;
end $$;
alter table public.watch_progress enable row level security;
grant select, insert, update, delete on public.watch_progress to authenticated;
drop policy if exists "Users manage own watch progress" on public.watch_progress;
drop policy if exists "select_own_progress" on public.watch_progress;
drop policy if exists "insert_own_progress" on public.watch_progress;
drop policy if exists "update_own_progress" on public.watch_progress;
drop policy if exists "delete_own_progress" on public.watch_progress;
create policy "select_own_progress" on public.watch_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert_own_progress" on public.watch_progress for insert to authenticated
  with check ((select auth.uid()) = user_id and title_id is not null);
create policy "update_own_progress" on public.watch_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and title_id is not null);
create policy "delete_own_progress" on public.watch_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Publisher follows: keep the legacy publisher_id column but add the current
-- publisher_name contract used by the Cinema app.
alter table public.publisher_follows add column if not exists publisher_name text;
alter table public.publisher_follows add column if not exists created_at timestamptz;
update public.publisher_follows pf
set publisher_name = coalesce(p.name, pf.publisher_id::text),
    created_at = coalesce(pf.created_at, pf.followed_at, now())
from public.publishers p
where p.id = pf.publisher_id and (pf.publisher_name is null or pf.created_at is null);
update public.publisher_follows
set publisher_name = coalesce(publisher_name, publisher_id::text),
    created_at = coalesce(created_at, followed_at, now());
alter table public.publisher_follows alter column publisher_name set not null;
alter table public.publisher_follows alter column created_at set default now();
alter table public.publisher_follows alter column created_at set not null;
alter table public.publisher_follows alter column user_id set default auth.uid();
alter table public.publisher_follows alter column publisher_id drop not null;
alter table public.publisher_follows drop constraint if exists publisher_follows_pkey;
alter table public.publisher_follows add constraint publisher_follows_pkey primary key (user_id, publisher_name);
create index if not exists publisher_follows_name_idx on public.publisher_follows(publisher_name);
alter table public.publisher_follows enable row level security;
grant select, insert, delete on public.publisher_follows to authenticated;
drop policy if exists "Users manage own publisher follows" on public.publisher_follows;
drop policy if exists "select_own_follows" on public.publisher_follows;
drop policy if exists "insert_own_follow" on public.publisher_follows;
drop policy if exists "delete_own_follow" on public.publisher_follows;
create policy "select_own_follows" on public.publisher_follows for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert_own_follow" on public.publisher_follows for insert to authenticated
  with check ((select auth.uid()) = user_id and char_length(publisher_name) between 1 and 120);
create policy "delete_own_follow" on public.publisher_follows for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Watch parties and their member/message tables.
create table if not exists public.watch_parties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists watch_parties_host_idx on public.watch_parties(host_id);
create index if not exists watch_parties_title_idx on public.watch_parties(title_id);

create table if not exists public.watch_party_members (
  party_id uuid not null references public.watch_parties(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null default 'guest' check (role in ('host', 'guest')),
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);
create index if not exists watch_party_members_user_idx on public.watch_party_members(user_id);

create table if not exists public.watch_party_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.watch_parties(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists watch_party_messages_party_idx on public.watch_party_messages(party_id, created_at);

create or replace function public.is_party_member(p_party_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.watch_party_members m
  where m.party_id = p_party_id and m.user_id = auth.uid()
); $$;
create or replace function public.is_party_host(p_party_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.watch_parties p
  where p.id = p_party_id and p.host_id = auth.uid()
); $$;
revoke all on function public.is_party_member(uuid) from public, anon;
revoke all on function public.is_party_host(uuid) from public, anon;
grant execute on function public.is_party_member(uuid) to authenticated;
grant execute on function public.is_party_host(uuid) to authenticated;

create or replace function public.add_watch_party_host()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.watch_party_members (party_id, user_id, role)
  values (new.id, new.host_id, 'host')
  on conflict (party_id, user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.add_watch_party_host() from public, anon, authenticated;
drop trigger if exists watch_party_add_host on public.watch_parties;
create trigger watch_party_add_host after insert on public.watch_parties
  for each row execute function public.add_watch_party_host();

create or replace function public.join_watch_party(p_invite_code text)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_party public.watch_parties%rowtype;
begin
  if auth.uid() is null then
    raise exception 'You need to be signed in to join a watch party.';
  end if;
  select * into v_party from public.watch_parties
  where invite_code = upper(trim(p_invite_code));
  if not found then
    raise exception 'No watch party matches that invite code.';
  end if;
  if v_party.status = 'ended' then
    raise exception 'This watch party has already ended.';
  end if;
  insert into public.watch_party_members (party_id, user_id, role)
  values (v_party.id, auth.uid(), case when v_party.host_id = auth.uid() then 'host' else 'guest' end)
  on conflict (party_id, user_id) do nothing;
  return v_party.id;
end;
$$;
revoke all on function public.join_watch_party(text) from public, anon;
grant execute on function public.join_watch_party(text) to authenticated;

alter table public.watch_parties enable row level security;
alter table public.watch_party_members enable row level security;
alter table public.watch_party_messages enable row level security;
grant select, delete on public.watch_parties to authenticated;
grant insert (host_id, title_id, name, visibility, scheduled_at) on public.watch_parties to authenticated;
grant update (name, visibility, scheduled_at, status, updated_at) on public.watch_parties to authenticated;
drop policy if exists "select_visible_parties" on public.watch_parties;
create policy "select_visible_parties" on public.watch_parties for select to authenticated
  using (host_id = (select auth.uid()) or visibility = 'public' or public.is_party_member(id));
drop policy if exists "insert_own_party" on public.watch_parties;
create policy "insert_own_party" on public.watch_parties for insert to authenticated
  with check (host_id = (select auth.uid()));
drop policy if exists "update_own_party" on public.watch_parties;
create policy "update_own_party" on public.watch_parties for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));
drop policy if exists "delete_own_party" on public.watch_parties;
create policy "delete_own_party" on public.watch_parties for delete to authenticated
  using (host_id = (select auth.uid()));

grant select, delete on public.watch_party_members to authenticated;
grant insert (party_id, user_id, role) on public.watch_party_members to authenticated;
drop policy if exists "select_party_members" on public.watch_party_members;
create policy "select_party_members" on public.watch_party_members for select to authenticated
  using (
    public.is_party_member(party_id)
    or exists (select 1 from public.watch_parties p where p.id = watch_party_members.party_id and p.visibility = 'public')
  );
drop policy if exists "join_public_party" on public.watch_party_members;
create policy "join_public_party" on public.watch_party_members for insert to authenticated
  with check (
    user_id = (select auth.uid()) and role = 'guest'
    and exists (
      select 1 from public.watch_parties p
      where p.id = watch_party_members.party_id and p.visibility = 'public' and p.status <> 'ended'
    )
  );
drop policy if exists "leave_or_remove_guest" on public.watch_party_members;
create policy "leave_or_remove_guest" on public.watch_party_members for delete to authenticated
  using ((user_id = (select auth.uid()) and role = 'guest') or public.is_party_host(party_id));

grant select, delete on public.watch_party_messages to authenticated;
grant insert (party_id, user_id, body) on public.watch_party_messages to authenticated;
drop policy if exists "select_party_messages" on public.watch_party_messages;
create policy "select_party_messages" on public.watch_party_messages for select to authenticated
  using (public.is_party_member(party_id));
drop policy if exists "insert_party_message" on public.watch_party_messages;
create policy "insert_party_message" on public.watch_party_messages for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_party_member(party_id));
drop policy if exists "delete_party_message" on public.watch_party_messages;
create policy "delete_party_message" on public.watch_party_messages for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_party_host(party_id));

-- Profile reads are intentionally limited to signed-in members; private profiles
-- remain visible only to their owner and accepted friends.
grant select, insert, update on public.profiles to authenticated;
drop policy if exists "insert_own_profile" on public.profiles;
create policy "insert_own_profile" on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and id = (select auth.uid()));
drop policy if exists "update_own_profile" on public.profiles;
create policy "update_own_profile" on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and id = (select auth.uid()));

notify pgrst, 'reload schema';
