-- Cinema in-app notifications and friends-only feed visibility.
-- Notifications are private to their recipient; events are created by database triggers.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid null references auth.users(id) on delete set null,
  type text not null check (type in (
    'friend_request',
    'friend_accepted',
    'post_reaction',
    'post_comment',
    'watch_party_joined',
    'watch_party_live'
  )),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 500),
  href text not null default '/friends',
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "Users read their own notifications" on public.notifications;
create policy "Users read their own notifications"
  on public.notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users mark their own notifications as read" on public.notifications;
create policy "Users mark their own notifications as read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Friends-only posts are visible to the author and accepted friends.
drop policy if exists "Public can read published Letterbox posts" on public.letterbox_posts;
create policy "People can read published Letterbox posts"
  on public.letterbox_posts for select
  using (
    status = 'published'
    and (
      visibility = 'public'
      or author_id = auth.uid()
      or (
        visibility = 'friends'
        and exists (
          select 1
          from public.friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = auth.uid() and f.addressee_id = letterbox_posts.author_id)
              or (f.addressee_id = auth.uid() and f.requester_id = letterbox_posts.author_id)
            )
        )
      )
    )
  );

-- Reactions and comments must target a post the acting member is allowed to read.
drop policy if exists "Users react as themselves" on public.letterbox_reactions;
create policy "Users react to visible Letterbox posts"
  on public.letterbox_reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.letterbox_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

drop policy if exists "Users create their own Letterbox comments" on public.letterbox_comments;
create policy "Users comment on visible Letterbox posts"
  on public.letterbox_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'published'
    and exists (
      select 1 from public.letterbox_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

create or replace function public.cinema_create_notification(
  p_user_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_href text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if p_user_id is null or p_actor_id is null or p_user_id = p_actor_id then
    return;
  end if;
  insert into public.notifications (user_id, actor_id, type, title, body, href)
  values (p_user_id, p_actor_id, p_type, p_title, p_body, p_href);
end;
$$;

revoke all on function public.cinema_create_notification(uuid, uuid, text, text, text, text) from public, anon, authenticated;

create or replace function public.cinema_notify_friendship()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.cinema_create_notification(
      new.addressee_id, new.requester_id, 'friend_request',
      'New Friend Request', 'Someone Wants To Connect With You On Cinema.', '/friends'
    );
  elsif tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    perform public.cinema_create_notification(
      new.requester_id, new.addressee_id, 'friend_accepted',
      'Friend Request Accepted', 'Your Cinema Connection Is Now Active.', '/friends'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists cinema_friendship_notification on public.friendships;
create trigger cinema_friendship_notification
  after insert or update of status on public.friendships
  for each row execute function public.cinema_notify_friendship();

create or replace function public.cinema_notify_letterbox_activity()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  post_author uuid;
  post_visibility text;
  post_status text;
  activity_actor uuid;
  activity_post uuid;
begin
  if tg_table_name = 'letterbox_reactions' then
    activity_actor := new.user_id;
    activity_post := new.post_id;
  else
    if new.status <> 'published' then return new; end if;
    activity_actor := new.author_id;
    activity_post := new.post_id;
  end if;

  select author_id, visibility, status
    into post_author, post_visibility, post_status
    from public.letterbox_posts
    where id = activity_post;

  if post_author is null or post_status <> 'published' then return new; end if;

  if post_visibility = 'friends' and not exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.requester_id = activity_actor and f.addressee_id = post_author)
        or (f.addressee_id = activity_actor and f.requester_id = post_author)
      )
  ) then
    return new;
  end if;

  perform public.cinema_create_notification(
    post_author,
    activity_actor,
    case when tg_table_name = 'letterbox_reactions' then 'post_reaction' else 'post_comment' end,
    case when tg_table_name = 'letterbox_reactions' then 'New Reaction To Your Post' else 'New Comment On Your Post' end,
    case when tg_table_name = 'letterbox_reactions' then 'Someone Reacted To Something You Shared.' else 'Someone Commented On Something You Shared.' end,
    '/letterbox'
  );
  return new;
end;
$$;

drop trigger if exists cinema_letterbox_reaction_notification on public.letterbox_reactions;
create trigger cinema_letterbox_reaction_notification
  after insert on public.letterbox_reactions
  for each row execute function public.cinema_notify_letterbox_activity();

drop trigger if exists cinema_letterbox_comment_notification on public.letterbox_comments;
create trigger cinema_letterbox_comment_notification
  after insert on public.letterbox_comments
  for each row execute function public.cinema_notify_letterbox_activity();

create or replace function public.cinema_notify_party_join()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  party_host uuid;
  party_name text;
begin
  if new.role <> 'guest' then return new; end if;
  select host_id, name into party_host, party_name
    from public.watch_parties where id = new.party_id;
  perform public.cinema_create_notification(
    party_host, new.user_id, 'watch_party_joined',
    'Someone Joined Your Watch Party',
    'A Viewer Joined “' || coalesce(party_name, 'Your Watch Party') || '”.',
    '/watch-parties/' || new.party_id::text
  );
  return new;
end;
$$;

drop trigger if exists cinema_watch_party_join_notification on public.watch_party_members;
create trigger cinema_watch_party_join_notification
  after insert on public.watch_party_members
  for each row execute function public.cinema_notify_party_join();

create or replace function public.cinema_notify_party_live()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  member record;
begin
  if new.status = 'live' and old.status is distinct from 'live' then
    for member in
      select user_id from public.watch_party_members
      where party_id = new.id and user_id <> new.host_id
    loop
      perform public.cinema_create_notification(
        member.user_id, new.host_id, 'watch_party_live',
        'Your Watch Party Is Live',
        '“' || new.name || '” Has Started.',
        '/watch-parties/' || new.id::text
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists cinema_watch_party_live_notification on public.watch_parties;
create trigger cinema_watch_party_live_notification
  after update of status on public.watch_parties
  for each row execute function public.cinema_notify_party_live();

-- Realtime powers the in-app notification badge and notification list.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
