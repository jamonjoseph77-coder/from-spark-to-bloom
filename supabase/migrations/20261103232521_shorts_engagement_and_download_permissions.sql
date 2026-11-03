-- Short-specific engagement and rights-aware download permissions.
-- Downloads are opt-in per clip; existing and new videos remain stream-only by default.
alter table public.discover_clips
  add column if not exists download_allowed boolean not null default false;

create table if not exists public.discover_clip_reactions (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.discover_clips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (clip_id, user_id)
);
create index if not exists discover_clip_reactions_clip_idx on public.discover_clip_reactions(clip_id);

create table if not exists public.discover_clip_comments (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references public.discover_clips(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published', 'hidden', 'removed')),
  created_at timestamptz not null default now()
);
create index if not exists discover_clip_comments_clip_idx on public.discover_clip_comments(clip_id, created_at desc);

alter table public.discover_clip_reactions enable row level security;
alter table public.discover_clip_comments enable row level security;

drop policy if exists "Public can read reactions on published clips" on public.discover_clip_reactions;
create policy "Public can read reactions on published clips" on public.discover_clip_reactions
  for select using (exists (select 1 from public.discover_clips c where c.id = clip_id and c.is_published = true));

drop policy if exists "Signed-in viewers react to published clips" on public.discover_clip_reactions;
create policy "Signed-in viewers react to published clips" on public.discover_clip_reactions
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.discover_clips c where c.id = clip_id and c.is_published = true)
  );

drop policy if exists "Viewers update their own clip reactions" on public.discover_clip_reactions;
create policy "Viewers update their own clip reactions" on public.discover_clip_reactions
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Viewers remove their own clip reactions" on public.discover_clip_reactions;
create policy "Viewers remove their own clip reactions" on public.discover_clip_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Public can read comments on published clips" on public.discover_clip_comments;
create policy "Public can read comments on published clips" on public.discover_clip_comments
  for select using (status = 'published' and exists (
    select 1 from public.discover_clips c where c.id = clip_id and c.is_published = true
  ));

drop policy if exists "Signed-in viewers comment on published clips" on public.discover_clip_comments;
create policy "Signed-in viewers comment on published clips" on public.discover_clip_comments
  for insert to authenticated with check (
    author_id = (select auth.uid()) and status = 'published'
    and exists (select 1 from public.discover_clips c where c.id = clip_id and c.is_published = true)
  );

drop policy if exists "Viewers remove their own clip comments" on public.discover_clip_comments;
create policy "Viewers remove their own clip comments" on public.discover_clip_comments
  for delete to authenticated using (author_id = (select auth.uid()));

grant select on public.discover_clip_reactions, public.discover_clip_comments to anon, authenticated;
grant insert, update, delete on public.discover_clip_reactions to authenticated;
grant insert, delete on public.discover_clip_comments to authenticated;
