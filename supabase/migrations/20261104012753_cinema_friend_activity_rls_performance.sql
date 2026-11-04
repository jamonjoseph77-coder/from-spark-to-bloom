-- Consolidate friend-visible and own-row reads, and cache auth.uid() per statement.
drop policy if exists "Friends can read shared publisher follows" on public.publisher_follows;
drop policy if exists "Friends can read opted-in watch activity" on public.watch_progress;
drop policy if exists select_own_follows on public.publisher_follows;
create policy select_own_follows on public.publisher_follows for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.friendships f where f.status = 'accepted'
      and ((f.requester_id = (select auth.uid()) and f.addressee_id = publisher_follows.user_id)
        or (f.addressee_id = (select auth.uid()) and f.requester_id = publisher_follows.user_id))
  )
);
drop policy if exists select_own_progress on public.watch_progress;
create policy select_own_progress on public.watch_progress for select to authenticated using (
  user_id = (select auth.uid()) or (
    updated_at >= now() - interval '20 minutes' and completed = false and exists (
      select 1 from public.profiles p join public.friendships f on f.status = 'accepted'
        and ((f.requester_id = (select auth.uid()) and f.addressee_id = p.user_id)
          or (f.addressee_id = (select auth.uid()) and f.requester_id = p.user_id))
      where p.user_id = watch_progress.user_id and p.share_watching_activity = true
    )
  )
);
drop policy if exists "Users can read their own saved clips" on public.discover_clip_saves;
create policy "Users can read their own saved clips" on public.discover_clip_saves for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users can save clips for themselves" on public.discover_clip_saves;
create policy "Users can save clips for themselves" on public.discover_clip_saves for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users can unsave their own clips" on public.discover_clip_saves;
create policy "Users can unsave their own clips" on public.discover_clip_saves for delete to authenticated using (user_id = (select auth.uid()));
