-- Cinema Letterbox: entertainment-centred public posts, reactions, comments and studio verification.
-- No direct messages and no unrestricted video uploads are introduced.
create table if not exists public.letterbox_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete cascade,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like' check (reaction in ('like','love','fire','laugh','wow')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);
create index if not exists letterbox_reactions_post_idx on public.letterbox_reactions(post_id);

create table if not exists public.letterbox_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.letterbox_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now()
);
create index if not exists letterbox_comments_post_idx on public.letterbox_comments(post_id, created_at);

-- A badge is displayed only for an explicitly verified studio record.
-- Applications remain pending until an authorised Cinema administrator approves them.
create table if not exists public.studio_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
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
create policy "Public can read published Letterbox posts" on public.letterbox_posts for select using (
  status = 'published' and (visibility = 'public' or author_id = auth.uid())
);
drop policy if exists "Users create their own Letterbox posts" on public.letterbox_posts;
create policy "Users create their own Letterbox posts" on public.letterbox_posts for insert to authenticated with check (author_id = auth.uid() and status = 'published');
drop policy if exists "Users edit their own Letterbox posts" on public.letterbox_posts;
create policy "Users edit their own Letterbox posts" on public.letterbox_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "Users delete their own Letterbox posts" on public.letterbox_posts;
create policy "Users delete their own Letterbox posts" on public.letterbox_posts for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Public can read published Letterbox reactions" on public.letterbox_reactions;
create policy "Public can read published Letterbox reactions" on public.letterbox_reactions for select using (true);
drop policy if exists "Users react as themselves" on public.letterbox_reactions;
create policy "Users react as themselves" on public.letterbox_reactions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users remove their own reactions" on public.letterbox_reactions;
create policy "Users remove their own reactions" on public.letterbox_reactions for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Public can read published Letterbox comments" on public.letterbox_comments;
create policy "Public can read published Letterbox comments" on public.letterbox_comments for select using (status = 'published');
drop policy if exists "Users create their own Letterbox comments" on public.letterbox_comments;
create policy "Users create their own Letterbox comments" on public.letterbox_comments for insert to authenticated with check (author_id = auth.uid() and status = 'published');
drop policy if exists "Users delete their own Letterbox comments" on public.letterbox_comments;
create policy "Users delete their own Letterbox comments" on public.letterbox_comments for delete to authenticated using (author_id = auth.uid());

drop policy if exists "Public can view verified studios" on public.studio_accounts;
create policy "Public can view verified studios" on public.studio_accounts for select using (verification_status = 'verified' or owner_id = auth.uid());
drop policy if exists "Users can apply for studio verification" on public.studio_accounts;
create policy "Users can apply for studio verification" on public.studio_accounts for insert to authenticated with check (owner_id = auth.uid() and verification_status = 'pending' and verified_at is null);
drop policy if exists "Owners can update pending studio applications" on public.studio_accounts;
create policy "Owners can update pending studio applications" on public.studio_accounts for update to authenticated using (owner_id = auth.uid() and verification_status = 'pending') with check (owner_id = auth.uid() and verification_status = 'pending' and verified_at is null);

-- Only the existing Cinema admin check can approve, suspend or reject a studio.
drop policy if exists "Cinema admins manage studio verification" on public.studio_accounts;
create policy "Cinema admins manage studio verification" on public.studio_accounts
for update to authenticated using (public.is_cinema_admin()) with check (public.is_cinema_admin());

-- Realtime publication is enabled when the project has the standard Supabase publication.
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
