-- Ensure the admin roster and authorization helper exist before any later
-- migration installs administrator-only policies (including Shorts submissions).
create table if not exists public.admin_users (
  user_id uuid primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from public, anon, authenticated;
grant select on table public.admin_users to authenticated;
grant all on table public.admin_users to service_role;
drop policy if exists "select_own_admin_row" on public.admin_users;
create policy "select_own_admin_row"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_cinema_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_cinema_admin() from public, anon;
grant execute on function public.is_cinema_admin() to authenticated, service_role;

-- Cinema Letterbox: entertainment-centred public posts, reactions, comments and studio verification.
create table if not exists public.letterbox_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  title_id uuid null references public.titles(id) on delete set null,
  image_url text null,
  visibility text not null default 'public' check (visibility in ('public','friends')),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists letterbox_posts_created_idx on public.letterbox_posts(created_at desc);
create index if not exists letterbox_posts_author_idx on public.letterbox_posts(author_id, created_at desc);
create index if not exists letterbox_posts_title_idx on public.letterbox_posts(title_id, created_at desc);

create table if not exists public.letterbox_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.letterbox_posts(id) on delete cascade,
  user_id uuid not null,
  reaction text not null default 'like' check (reaction in ('like','love','fire','laugh','wow')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);
create index if not exists letterbox_reactions_post_idx on public.letterbox_reactions(post_id);

create table if not exists public.letterbox_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.letterbox_posts(id) on delete cascade,
  author_id uuid not null,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now()
);
create index if not exists letterbox_comments_post_idx on public.letterbox_comments(post_id, created_at);

-- A badge is displayed only for an explicitly verified studio record.
create table if not exists public.studio_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  studio_name text not null check (char_length(studio_name) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1200),
  website_url text null,
  logo_url text null,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected','suspended')),
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id)
);
create index if not exists studio_accounts_status_idx on public.studio_accounts(verification_status, studio_name);

alter table public.letterbox_posts enable row level security;
alter table public.letterbox_reactions enable row level security;
alter table public.letterbox_comments enable row level security;
alter table public.studio_accounts enable row level security;

drop policy if exists "Public can read published Letterbox posts" on public.letterbox_posts;
drop policy if exists "People can read published Letterbox posts" on public.letterbox_posts;
create policy "People can read published Letterbox posts" on public.letterbox_posts for select using (
  status = 'published'
  and (
    visibility = 'public'
    or author_id = auth.uid()
    or (
      visibility = 'friends'
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.addressee_id = letterbox_posts.author_id)
            or (f.addressee_id = auth.uid() and f.requester_id = letterbox_posts.author_id)
          )
      )
    )
  )
);
drop policy if exists "Users create their own Letterbox posts" on public.letterbox_posts;
create policy "Users create their own Letterbox posts" on public.letterbox_posts for insert to authenticated with check (author_id = auth.uid() and status = 'published');
drop policy if exists "Users edit their own Letterbox posts" on public.letterbox_posts;
create policy "Users edit their own Letterbox posts" on public.letterbox_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "Users delete their own Letterbox posts" on public.letterbox_posts;
create policy "Users delete their own Letterbox posts" on public.letterbox_posts for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Public can read published Letterbox reactions" on public.letterbox_reactions;
drop policy if exists "People can read reactions on visible Letterbox posts" on public.letterbox_reactions;
create policy "People can read reactions on visible Letterbox posts" on public.letterbox_reactions for select using (
  exists (
    select 1 from public.letterbox_posts p
    where p.id = letterbox_reactions.post_id
      and p.status = 'published'
      and (
        p.visibility = 'public'
        or p.author_id = auth.uid()
        or (
          p.visibility = 'friends'
          and exists (
            select 1 from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = p.author_id)
                or (f.addressee_id = auth.uid() and f.requester_id = p.author_id)
              )
          )
        )
      )
  )
);
drop policy if exists "Users react as themselves" on public.letterbox_reactions;
create policy "Users react to visible Letterbox posts" on public.letterbox_reactions for insert to authenticated with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.letterbox_posts p
    where p.id = post_id and p.status = 'published'
  )
);
drop policy if exists "Users remove their own reactions" on public.letterbox_reactions;
create policy "Users remove their own reactions" on public.letterbox_reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Public can read published Letterbox comments" on public.letterbox_comments;
drop policy if exists "People can read comments on visible Letterbox posts" on public.letterbox_comments;
create policy "People can read comments on visible Letterbox posts" on public.letterbox_comments for select using (
  status = 'published'
  and exists (
    select 1 from public.letterbox_posts p
    where p.id = letterbox_comments.post_id
      and p.status = 'published'
      and (
        p.visibility = 'public'
        or p.author_id = auth.uid()
        or (
          p.visibility = 'friends'
          and exists (
            select 1 from public.friendships f
            where f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.addressee_id = p.author_id)
                or (f.addressee_id = auth.uid() and f.requester_id = p.author_id)
              )
          )
        )
      )
  )
);
drop policy if exists "Users create their own Letterbox comments" on public.letterbox_comments;
create policy "Users comment on visible Letterbox posts" on public.letterbox_comments for insert to authenticated with check (
  author_id = auth.uid()
  and status = 'published'
  and exists (
    select 1 from public.letterbox_posts p
    where p.id = post_id and p.status = 'published'
  )
);
drop policy if exists "Users delete their own Letterbox comments" on public.letterbox_comments;
create policy "Users delete their own Letterbox comments" on public.letterbox_comments for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Public can view verified studios" on public.studio_accounts;
create policy "Public can view verified studios" on public.studio_accounts for select using (verification_status = 'verified' or owner_id = auth.uid());
drop policy if exists "Cinema admins can review studio applications" on public.studio_accounts;
create policy "Cinema admins can review studio applications" on public.studio_accounts for select to authenticated using (public.is_cinema_admin());
drop policy if exists "Users can apply for studio verification" on public.studio_accounts;
create policy "Users can apply for studio verification" on public.studio_accounts for insert to authenticated with check (owner_id = auth.uid() and verification_status = 'pending' and verified_at is null);
drop policy if exists "Owners can update pending studio applications" on public.studio_accounts;
create policy "Owners can update pending studio applications" on public.studio_accounts for update to authenticated using (owner_id = auth.uid() and verification_status = 'pending') with check (owner_id = auth.uid() and verification_status = 'pending' and verified_at is null);
drop policy if exists "Cinema admins manage studio verification" on public.studio_accounts;
create policy "Cinema admins manage studio verification" on public.studio_accounts
for update to authenticated using (public.is_cinema_admin()) with check (public.is_cinema_admin());

-- Realtime publication for the Letterbox feed tables.
do $$
declare
  table_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach table_name in array array['letterbox_posts','letterbox_reactions','letterbox_comments'] loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
      ) then
        execute format('alter publication supabase_realtime add table public.%I', table_name);
      end if;
    end loop;
  end if;
end
$$;

-- Expand publisher video classification for official title extras.
alter table public.discover_clips
  drop constraint if exists discover_clips_kind_check;

alter table public.discover_clips
  add constraint discover_clips_kind_check
  check (kind in (
    'trailer',
    'short',
    'clip',
    'featured',
    'behind_the_scenes',
    'interview',
    'making_of',
    'deleted_scene',
    'cast_featurette',
    'production_diary'
  ));

create index if not exists discover_clips_title_kind_published_idx
  on public.discover_clips (title_id, kind, is_published, sort_order);

-- Cinema in-app notifications and friends-only feed visibility.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  actor_id uuid null,
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

-- Creator Shorts are uploaded into a public playback bucket but remain private to the
-- submitting creator and Cinema administrators until reviewed.
create table if not exists public.creator_short_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  headline text not null check (char_length(headline) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  publisher_name text not null check (char_length(publisher_name) between 1 and 120),
  video_path text not null,
  poster_path text null,
  title_id uuid null references public.titles(id) on delete set null,
  duration_seconds integer null check (duration_seconds is null or duration_seconds between 1 and 90),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);
create index if not exists creator_short_submissions_review_idx
  on public.creator_short_submissions(status, created_at desc);
create index if not exists creator_short_submissions_owner_idx
  on public.creator_short_submissions(user_id, created_at desc);

alter table public.creator_short_submissions enable row level security;
grant select, insert on public.creator_short_submissions to authenticated;
grant update on public.creator_short_submissions to authenticated;

drop policy if exists "Creators read own Shorts submissions" on public.creator_short_submissions;
create policy "Creators read own Shorts submissions"
  on public.creator_short_submissions for select to authenticated
  using (user_id = auth.uid() or public.is_cinema_admin());

drop policy if exists "Creators submit own Shorts" on public.creator_short_submissions;
create policy "Creators submit own Shorts"
  on public.creator_short_submissions for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null);

drop policy if exists "Cinema admins review creator Shorts" on public.creator_short_submissions;
create policy "Cinema admins review creator Shorts"
  on public.creator_short_submissions for update to authenticated
  using (public.is_cinema_admin()) with check (public.is_cinema_admin());

-- Ensure the public Cinema Shorts feed exists and can be read by visitors.
create table if not exists public.discover_clips (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'short',
  headline text not null,
  description text not null default '',
  video_url text not null,
  poster_url text not null default '',
  publisher_name text not null default '',
  title_id uuid null references public.titles(id) on delete set null,
  duration_seconds integer null check (duration_seconds is null or duration_seconds > 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discover_clips_public_feed_idx
  on public.discover_clips(is_published, sort_order, created_at desc);

alter table public.discover_clips enable row level security;
grant select on public.discover_clips to anon, authenticated;
grant insert, update, delete on public.discover_clips to authenticated;

drop policy if exists "Anyone can read published Cinema clips" on public.discover_clips;
create policy "Anyone can read published Cinema clips"
  on public.discover_clips for select to anon, authenticated
  using (is_published = true);

drop policy if exists "Cinema admins manage discover clips" on public.discover_clips;
create policy "Cinema admins manage discover clips"
  on public.discover_clips for all to authenticated
  using (public.is_cinema_admin())
  with check (public.is_cinema_admin());

-- Data API grants for the new tables.
grant select on public.letterbox_posts to anon, authenticated;
grant insert, update, delete on public.letterbox_posts to authenticated;
grant select on public.letterbox_reactions to anon, authenticated;
grant insert, delete on public.letterbox_reactions to authenticated;
grant select on public.letterbox_comments to anon, authenticated;
grant insert, delete on public.letterbox_comments to authenticated;
grant select on public.studio_accounts to anon, authenticated;
grant insert, update on public.studio_accounts to authenticated;
grant all on public.letterbox_posts to service_role;
grant all on public.letterbox_reactions to service_role;
grant all on public.letterbox_comments to service_role;
grant all on public.studio_accounts to service_role;
grant all on public.notifications to service_role;
grant all on public.creator_short_submissions to service_role;

notify pgrst, 'reload schema';