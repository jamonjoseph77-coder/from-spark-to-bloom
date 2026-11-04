-- Keep trigger-only SECURITY DEFINER functions inaccessible through the Data API.
-- PostgreSQL triggers execute their functions without requiring client EXECUTE grants.
revoke all on function public.cinema_notify_friendship() from public, anon, authenticated;
revoke all on function public.cinema_notify_letterbox_activity() from public, anon, authenticated;
revoke all on function public.cinema_notify_party_join() from public, anon, authenticated;
revoke all on function public.cinema_notify_party_live() from public, anon, authenticated;

-- The current app's title-based favourites model needs a real primary key.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.favourites'::regclass
      and contype = 'p'
  ) then
    alter table public.favourites
      add constraint favourites_pkey primary key using index favourites_user_title_uidx;
  end if;
end $$;

-- Cover foreign keys used by common joins/deletes. These are intentionally
-- additive; no existing indexes or records are removed.
create index if not exists creator_short_submissions_title_idx
  on public.creator_short_submissions(title_id);
create index if not exists favourites_content_id_idx
  on public.favourites(content_id);
create index if not exists friendships_requester_idx
  on public.friendships(requester_id);
create index if not exists letterbox_comments_author_idx
  on public.letterbox_comments(author_id);
create index if not exists letterbox_reactions_user_idx
  on public.letterbox_reactions(user_id);
create index if not exists notifications_actor_idx
  on public.notifications(actor_id);
create index if not exists watch_party_messages_user_idx
  on public.watch_party_messages(user_id);
create index if not exists watch_progress_content_id_idx
  on public.watch_progress(content_id);
create index if not exists watch_progress_title_id_idx
  on public.watch_progress(title_id);
create index if not exists watchlist_content_id_idx
  on public.watchlist(content_id);
create index if not exists watchlist_items_title_id_idx
  on public.watchlist_items(title_id);

-- Avoid overlapping permissive SELECT policies on the Shorts feed.
drop policy if exists "Cinema admins manage discover clips" on public.discover_clips;
drop policy if exists "Cinema admins insert discover clips" on public.discover_clips;
drop policy if exists "Cinema admins update discover clips" on public.discover_clips;
drop policy if exists "Cinema admins delete discover clips" on public.discover_clips;
create policy "Cinema admins insert discover clips"
  on public.discover_clips for insert to authenticated
  with check (public.is_cinema_admin());
create policy "Cinema admins update discover clips"
  on public.discover_clips for update to authenticated
  using (public.is_cinema_admin()) with check (public.is_cinema_admin());
create policy "Cinema admins delete discover clips"
  on public.discover_clips for delete to authenticated
  using (public.is_cinema_admin());

-- Consolidate studio visibility and review permissions without changing who
-- can see verified studios or who can review pending applications.
drop policy if exists "Public can view verified studios" on public.studio_accounts;
drop policy if exists "Cinema admins can review studio applications" on public.studio_accounts;
create policy "Public can view verified studios"
  on public.studio_accounts for select to anon
  using (verification_status = 'verified');
create policy "Members can view studio applications"
  on public.studio_accounts for select to authenticated
  using (
    verification_status = 'verified'
    or owner_id = (select auth.uid())
    or public.is_cinema_admin()
  );

-- Owners may edit their pending application; admins may review any application.
drop policy if exists "Owners can update pending studio applications" on public.studio_accounts;
drop policy if exists "Cinema admins manage studio verification" on public.studio_accounts;
create policy "Owners and admins update studio applications"
  on public.studio_accounts for update to authenticated
  using (
    (owner_id = (select auth.uid()) and verification_status = 'pending')
    or public.is_cinema_admin()
  )
  with check (
    public.is_cinema_admin()
    or (
      owner_id = (select auth.uid())
      and verification_status = 'pending'
      and verified_at is null
    )
  );

notify pgrst, 'reload schema';
