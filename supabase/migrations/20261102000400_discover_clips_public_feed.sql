-- Ensure the public Cinema Shorts feed exists and can be read by visitors.
-- Publisher writes remain restricted to authenticated Cinema administrators.
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
