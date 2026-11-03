-- Bootstrap the title catalogue and creator Shorts workflow on projects that
-- have the older content schema but not the current application schema.
-- Existing legacy tables and user records are left intact.

create extension if not exists pgcrypto;

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('movie', 'series', 'sport', 'news', 'live')),
  title text not null,
  synopsis text not null default '',
  genre text not null default '',
  release_year integer,
  release_date date,
  duration_minutes integer,
  publisher text not null default '',
  poster_url text not null default '',
  backdrop_url text not null default '',
  trailer_url text not null default '',
  playback_url text not null default '',
  subtitle_url text not null default '',
  availability text not null default '',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists titles_published_type_idx on public.titles (is_published, type);
alter table public.titles enable row level security;
grant select on public.titles to anon, authenticated;
grant insert, update, delete on public.titles to authenticated;
drop policy if exists "public_select_published_titles" on public.titles;
create policy "public_select_published_titles" on public.titles
  for select to anon using (is_published = true);
drop policy if exists "member_select_titles" on public.titles;
create policy "member_select_titles" on public.titles
  for select to authenticated using (is_published = true or public.is_cinema_admin());
drop policy if exists "admin_insert_titles" on public.titles;
create policy "admin_insert_titles" on public.titles
  for insert to authenticated with check (public.is_cinema_admin());
drop policy if exists "admin_update_titles" on public.titles;
create policy "admin_update_titles" on public.titles
  for update to authenticated using (public.is_cinema_admin()) with check (public.is_cinema_admin());
drop policy if exists "admin_delete_titles" on public.titles;
create policy "admin_delete_titles" on public.titles
  for delete to authenticated using (public.is_cinema_admin());

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  number integer not null check (number > 0),
  name text not null default '',
  created_at timestamptz not null default now(),
  unique (title_id, number)
);
alter table public.seasons enable row level security;
grant select on public.seasons to anon, authenticated;
grant insert, update, delete on public.seasons to authenticated;
drop policy if exists "select_visible_seasons" on public.seasons;
drop policy if exists "public_select_published_seasons" on public.seasons;
create policy "public_select_published_seasons" on public.seasons
  for select to anon using (
    exists (select 1 from public.titles t where t.id = seasons.title_id and t.is_published = true)
  );
drop policy if exists "member_select_visible_seasons" on public.seasons;
create policy "member_select_visible_seasons" on public.seasons
  for select to authenticated using (
    exists (select 1 from public.titles t where t.id = seasons.title_id and (t.is_published = true or public.is_cinema_admin()))
  );
drop policy if exists "admin_insert_seasons" on public.seasons;
create policy "admin_insert_seasons" on public.seasons
  for insert to authenticated with check (public.is_cinema_admin());
drop policy if exists "admin_update_seasons" on public.seasons;
create policy "admin_update_seasons" on public.seasons
  for update to authenticated using (public.is_cinema_admin()) with check (public.is_cinema_admin());
drop policy if exists "admin_delete_seasons" on public.seasons;
create policy "admin_delete_seasons" on public.seasons
  for delete to authenticated using (public.is_cinema_admin());

create table if not exists public.episodes (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  number integer not null check (number > 0),
  title text not null default '',
  synopsis text not null default '',
  duration_minutes integer,
  playback_url text not null default '',
  thumbnail_url text not null default '',
  created_at timestamptz not null default now(),
  unique (season_id, number)
);
alter table public.episodes enable row level security;
grant select on public.episodes to anon, authenticated;
grant insert, update, delete on public.episodes to authenticated;
drop policy if exists "select_visible_episodes" on public.episodes;
drop policy if exists "public_select_published_episodes" on public.episodes;
create policy "public_select_published_episodes" on public.episodes
  for select to anon using (
    exists (
      select 1 from public.seasons s
      join public.titles t on t.id = s.title_id
      where s.id = episodes.season_id and t.is_published = true
    )
  );
drop policy if exists "member_select_visible_episodes" on public.episodes;
create policy "member_select_visible_episodes" on public.episodes
  for select to authenticated using (
    exists (
      select 1 from public.seasons s
      join public.titles t on t.id = s.title_id
      where s.id = episodes.season_id and (t.is_published = true or public.is_cinema_admin())
    )
  );
drop policy if exists "admin_insert_episodes" on public.episodes;
create policy "admin_insert_episodes" on public.episodes
  for insert to authenticated with check (public.is_cinema_admin());
drop policy if exists "admin_update_episodes" on public.episodes;
create policy "admin_update_episodes" on public.episodes
  for update to authenticated using (public.is_cinema_admin()) with check (public.is_cinema_admin());
drop policy if exists "admin_delete_episodes" on public.episodes;
create policy "admin_delete_episodes" on public.episodes
  for delete to authenticated using (public.is_cinema_admin());

-- The existing discover_clips table is retained. Link optional title metadata
-- now that the current titles catalogue exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.discover_clips'::regclass
      and conname = 'discover_clips_title_id_fkey'
  ) then
    alter table public.discover_clips
      add constraint discover_clips_title_id_fkey
      foreign key (title_id) references public.titles(id) on delete set null;
  end if;
end $$;

create table if not exists public.creator_short_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  headline text not null check (char_length(headline) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  publisher_name text not null check (char_length(publisher_name) between 1 and 120),
  video_path text null,
  video_url text null,
  poster_path text null,
  title_id uuid null references public.titles(id) on delete set null,
  duration_seconds integer null check (duration_seconds is null or duration_seconds between 1 and 90),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  constraint creator_short_submissions_video_source_check check (
    (video_path is not null and video_url is null)
    or (video_path is null and video_url is not null)
  )
);
create index if not exists creator_short_submissions_review_idx
  on public.creator_short_submissions(status, created_at desc);
create index if not exists creator_short_submissions_owner_idx
  on public.creator_short_submissions(user_id, created_at desc);
alter table public.creator_short_submissions enable row level security;
grant select, insert, update on public.creator_short_submissions to authenticated;
drop policy if exists "Creators read own Shorts submissions" on public.creator_short_submissions;
create policy "Creators read own Shorts submissions"
  on public.creator_short_submissions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_cinema_admin());
drop policy if exists "Creators submit own Shorts" on public.creator_short_submissions;
create policy "Creators submit own Shorts"
  on public.creator_short_submissions for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and reviewed_at is null);
drop policy if exists "Cinema admins review creator Shorts" on public.creator_short_submissions;
create policy "Cinema admins review creator Shorts"
  on public.creator_short_submissions for update to authenticated
  using (public.is_cinema_admin()) with check (public.is_cinema_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cinema-shorts', 'cinema-shorts', true, 104857600,
    array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']),
  ('cinema-creator-submissions', 'cinema-creator-submissions', false, 104857600,
    array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can play approved creator Shorts" on storage.objects;
create policy "Public can play approved creator Shorts"
  on storage.objects for select to public
  using (bucket_id = 'cinema-shorts');
drop policy if exists "Creators upload private Shorts submissions" on storage.objects;
create policy "Creators upload private Shorts submissions"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cinema-creator-submissions'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists "Creators and admins read private Shorts submissions" on storage.objects;
create policy "Creators and admins read private Shorts submissions"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cinema-creator-submissions'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_cinema_admin()
    )
  );
drop policy if exists "Cinema admins manage public Shorts files" on storage.objects;
create policy "Cinema admins manage public Shorts files"
  on storage.objects for all to authenticated
  using (bucket_id = 'cinema-shorts' and public.is_cinema_admin())
  with check (bucket_id = 'cinema-shorts' and public.is_cinema_admin());

-- The auth trigger invokes this function internally; client roles do not need
-- direct RPC execution rights.
revoke all on function public.handle_new_user() from public, anon, authenticated;

notify pgrst, 'reload schema';
