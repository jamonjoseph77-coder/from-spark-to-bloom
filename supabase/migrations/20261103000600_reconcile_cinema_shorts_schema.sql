-- Reconcile the Cinema Shorts feed schema on the connected Supabase project.
-- Safe to run more than once. Does not create or grant any administrator membership.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
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

notify pgrst, 'reload schema';
