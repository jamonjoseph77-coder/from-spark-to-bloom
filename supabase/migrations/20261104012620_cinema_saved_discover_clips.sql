-- Members can save approved Cinema Shorts into a private My Cinema shelf.
create table if not exists public.discover_clip_saves (
  clip_id uuid not null references public.discover_clips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (clip_id, user_id)
);
create index if not exists discover_clip_saves_user_created_idx
  on public.discover_clip_saves (user_id, created_at desc);
alter table public.discover_clip_saves enable row level security;
drop policy if exists "Users can read their own saved clips" on public.discover_clip_saves;
create policy "Users can read their own saved clips" on public.discover_clip_saves for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can save clips for themselves" on public.discover_clip_saves;
create policy "Users can save clips for themselves" on public.discover_clip_saves for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users can unsave their own clips" on public.discover_clip_saves;
create policy "Users can unsave their own clips" on public.discover_clip_saves for delete to authenticated using (user_id = auth.uid());
