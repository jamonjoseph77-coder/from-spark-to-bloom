-- Repair the Shorts feed schema on projects where the original table migration
-- was never applied or where an earlier table was created with an incomplete shape.
create extension if not exists pgcrypto;

create table if not exists public.discover_clips (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'short',
  headline text not null default '',
  description text not null default '',
  video_url text not null default '',
  poster_url text not null default '',
  publisher_name text not null default '',
  title_id uuid null,
  duration_seconds integer null,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Make the migration safe for a partially-created legacy table too.
alter table public.discover_clips add column if not exists id uuid default gen_random_uuid();
alter table public.discover_clips add column if not exists kind text not null default 'short';
alter table public.discover_clips add column if not exists headline text not null default '';
alter table public.discover_clips add column if not exists description text not null default '';
alter table public.discover_clips add column if not exists video_url text not null default '';
alter table public.discover_clips add column if not exists poster_url text not null default '';
alter table public.discover_clips add column if not exists publisher_name text not null default '';
alter table public.discover_clips add column if not exists title_id uuid null;
alter table public.discover_clips add column if not exists duration_seconds integer null;
alter table public.discover_clips add column if not exists sort_order integer not null default 0;
alter table public.discover_clips add column if not exists is_published boolean not null default false;
alter table public.discover_clips add column if not exists created_at timestamptz not null default now();
alter table public.discover_clips add column if not exists updated_at timestamptz not null default now();

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

-- Tell PostgREST to refresh its schema cache immediately after this migration.
notify pgrst, 'reload schema';
