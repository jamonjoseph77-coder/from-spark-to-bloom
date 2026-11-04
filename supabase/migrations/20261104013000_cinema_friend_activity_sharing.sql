-- Explicit, opt-in friend visibility for publisher interests and current viewing.
-- Defaults are private; watch activity is short-lived and contains no playback position.
alter table public.profiles
  add column if not exists share_following boolean not null default false,
  add column if not exists share_watch_activity boolean not null default false;

drop policy if exists "Friends can view opted-in publisher interests" on public.publisher_follows;
create policy "Friends can view opted-in publisher interests"
  on public.publisher_follows for select to authenticated
  using (
    user_id <> (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.user_id = publisher_follows.user_id
        and p.share_following = true
    )
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = (select auth.uid()) and f.addressee_id = publisher_follows.user_id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = publisher_follows.user_id)
        )
    )
  );

create table if not exists public.friend_watch_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists friend_watch_activity_expiry_idx
  on public.friend_watch_activity(expires_at);
create index if not exists friend_watch_activity_title_idx
  on public.friend_watch_activity(title_id);

alter table public.friend_watch_activity enable row level security;
revoke all on table public.friend_watch_activity from public, anon, authenticated;
grant select, insert, update, delete on table public.friend_watch_activity to authenticated;

drop policy if exists "Friends can view opted-in current viewing" on public.friend_watch_activity;
create policy "Friends can view opted-in current viewing"
  on public.friend_watch_activity for select to authenticated
  using (
    user_id <> (select auth.uid())
    and expires_at > now()
    and exists (
      select 1 from public.profiles p
      where p.user_id = friend_watch_activity.user_id
        and p.share_watch_activity = true
    )
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = (select auth.uid()) and f.addressee_id = friend_watch_activity.user_id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = friend_watch_activity.user_id)
        )
    )
  );

drop policy if exists "Members manage their own current viewing" on public.friend_watch_activity;
create policy "Members manage their own current viewing"
  on public.friend_watch_activity for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
