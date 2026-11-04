-- Shared, persistent engagement for every Explore content surface.
create table if not exists public.discover_content_reactions (
  id uuid primary key default gen_random_uuid(),
  content_key text not null check (char_length(content_key) between 1 and 180),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (content_key, user_id)
);
create index if not exists discover_content_reactions_key_idx on public.discover_content_reactions(content_key, created_at desc);
create index if not exists discover_content_reactions_user_idx on public.discover_content_reactions(user_id);
create table if not exists public.discover_content_comments (
  id uuid primary key default gen_random_uuid(),
  content_key text not null check (char_length(content_key) between 1 and 180),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now()
);
create index if not exists discover_content_comments_key_idx on public.discover_content_comments(content_key, created_at desc);
create index if not exists discover_content_comments_author_idx on public.discover_content_comments(author_id);
create table if not exists public.discover_content_shares (
  id uuid primary key default gen_random_uuid(),
  content_key text not null check (char_length(content_key) between 1 and 180),
  content_title text not null check (char_length(content_title) between 1 and 180),
  content_url text not null check (char_length(content_url) between 1 and 1000),
  image_url text not null default '',
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 300),
  created_at timestamptz not null default now(),
  constraint discover_content_shares_not_self check (sender_id <> recipient_id)
);
create index if not exists discover_content_shares_recipient_idx on public.discover_content_shares(recipient_id, created_at desc);
create index if not exists discover_content_shares_sender_idx on public.discover_content_shares(sender_id, created_at desc);
alter table public.discover_content_reactions enable row level security;
alter table public.discover_content_comments enable row level security;
alter table public.discover_content_shares enable row level security;
grant select on public.discover_content_reactions to anon, authenticated;
grant insert, delete on public.discover_content_reactions to authenticated;
grant select on public.discover_content_comments to anon, authenticated;
grant insert, delete on public.discover_content_comments to authenticated;
grant select, insert, delete on public.discover_content_shares to authenticated;
drop policy if exists "Anyone can read Explore content likes" on public.discover_content_reactions;
create policy "Anyone can read Explore content likes" on public.discover_content_reactions for select to anon, authenticated using (true);
drop policy if exists "Members can like Explore content" on public.discover_content_reactions;
create policy "Members can like Explore content" on public.discover_content_reactions for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Members can remove their Explore likes" on public.discover_content_reactions;
create policy "Members can remove their Explore likes" on public.discover_content_reactions for delete to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Anyone can read published Explore comments" on public.discover_content_comments;
create policy "Anyone can read published Explore comments" on public.discover_content_comments for select to anon, authenticated using (status = 'published');
drop policy if exists "Members can comment on Explore content" on public.discover_content_comments;
create policy "Members can comment on Explore content" on public.discover_content_comments for insert to authenticated with check (author_id = (select auth.uid()) and status = 'published');
drop policy if exists "Members can remove their Explore comments" on public.discover_content_comments;
create policy "Members can remove their Explore comments" on public.discover_content_comments for delete to authenticated using (author_id = (select auth.uid()));
drop policy if exists "Members can read content shared with them or by them" on public.discover_content_shares;
create policy "Members can read content shared with them or by them" on public.discover_content_shares for select to authenticated using (sender_id = (select auth.uid()) or recipient_id = (select auth.uid()));
drop policy if exists "Members can share Explore content with friends" on public.discover_content_shares;
create policy "Members can share Explore content with friends" on public.discover_content_shares for insert to authenticated with check (
  sender_id = (select auth.uid()) and exists (
    select 1 from public.friendships f where f.status = 'accepted'
      and ((f.requester_id = sender_id and f.addressee_id = recipient_id)
        or (f.addressee_id = sender_id and f.requester_id = recipient_id))
  )
);
drop policy if exists "Senders can remove their Explore shares" on public.discover_content_shares;
create policy "Senders can remove their Explore shares" on public.discover_content_shares for delete to authenticated using (sender_id = (select auth.uid()));
insert into public.discover_content_reactions (content_key, user_id, created_at)
select 'clip:' || clip_id::text, user_id, created_at from public.discover_clip_reactions
on conflict (content_key, user_id) do nothing;
insert into public.discover_content_comments (content_key, author_id, body, status, created_at)
select 'clip:' || clip_id::text, author_id, body, status, created_at from public.discover_clip_comments old
where not exists (
  select 1 from public.discover_content_comments current
  where current.content_key = 'clip:' || old.clip_id::text and current.author_id = old.author_id
    and current.body = old.body and current.created_at = old.created_at
);
notify pgrst, 'reload schema';
