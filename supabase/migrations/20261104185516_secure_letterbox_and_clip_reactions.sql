-- Do not expose member IDs through public reaction table reads.
-- Aggregate functions return counts only for content the caller can view.

create or replace function public.get_discover_clip_engagement(p_clip_id uuid)
returns table (
  reaction_count bigint,
  liked_by_current_user boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    count(*)::bigint,
    coalesce(bool_or(r.user_id = (select auth.uid())), false)
  from public.discover_clip_reactions r
  where r.clip_id = p_clip_id
    and (select auth.uid()) is not null
    and exists (
      select 1 from public.discover_clips c
      where c.id = p_clip_id and c.is_published = true
    );
$function$;

revoke all on function public.get_discover_clip_engagement(uuid) from public, anon, authenticated;
grant execute on function public.get_discover_clip_engagement(uuid) to anon, authenticated;

create or replace function public.get_letterbox_post_engagement(p_post_ids uuid[])
returns table (
  post_id uuid,
  reaction_count bigint,
  liked_by_current_user boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    p.id,
    count(r.user_id)::bigint,
    coalesce(bool_or(r.user_id = (select auth.uid())), false)
  from public.letterbox_posts p
  left join public.letterbox_reactions r on r.post_id = p.id
  where p.id = any(p_post_ids)
    and p.status = 'published'
    and (
      p.visibility = 'public'
      or p.author_id = (select auth.uid())
      or (
        p.visibility = 'friends'
        and exists (
          select 1
          from public.friendships f
          where f.status = 'accepted'
            and (
              (f.requester_id = (select auth.uid()) and f.addressee_id = p.author_id)
              or (f.addressee_id = (select auth.uid()) and f.requester_id = p.author_id)
            )
        )
      )
    )
  group by p.id;
$function$;

revoke all on function public.get_letterbox_post_engagement(uuid[]) from public, anon, authenticated;
grant execute on function public.get_letterbox_post_engagement(uuid[]) to anon, authenticated;

drop policy if exists "Public can read reactions on published clips" on public.discover_clip_reactions;
create policy "Viewers read their own clip reactions"
  on public.discover_clip_reactions
  for select to authenticated
  using (user_id = (select auth.uid()));
revoke select on public.discover_clip_reactions from anon;
grant select on public.discover_clip_reactions to authenticated;

drop policy if exists "People can read reactions on visible Letterbox posts" on public.letterbox_reactions;
create policy "Users read their own Letterbox reactions"
  on public.letterbox_reactions
  for select to authenticated
  using (user_id = (select auth.uid()));
revoke select on public.letterbox_reactions from anon;
grant select on public.letterbox_reactions to authenticated;

drop policy if exists "Users comment on visible Letterbox posts" on public.letterbox_comments;
create policy "Users comment on visible Letterbox posts"
  on public.letterbox_comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'published'
    and exists (
      select 1
      from public.letterbox_posts p
      where p.id = letterbox_comments.post_id
        and p.status = 'published'
        and (
          p.visibility = 'public'
          or p.author_id = (select auth.uid())
          or (
            p.visibility = 'friends'
            and exists (
              select 1
              from public.friendships f
              where f.status = 'accepted'
                and (
                  (f.requester_id = (select auth.uid()) and f.addressee_id = p.author_id)
                  or (f.addressee_id = (select auth.uid()) and f.requester_id = p.author_id)
                )
            )
          )
        )
    )
  );

drop policy if exists "Users react to visible Letterbox posts" on public.letterbox_reactions;
create policy "Users react to visible Letterbox posts"
  on public.letterbox_reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.letterbox_posts p
      where p.id = letterbox_reactions.post_id
        and p.status = 'published'
        and (
          p.visibility = 'public'
          or p.author_id = (select auth.uid())
          or (
            p.visibility = 'friends'
            and exists (
              select 1
              from public.friendships f
              where f.status = 'accepted'
                and (
                  (f.requester_id = (select auth.uid()) and f.addressee_id = p.author_id)
                  or (f.addressee_id = (select auth.uid()) and f.requester_id = p.author_id)
                )
            )
          )
        )
    )
  );

notify pgrst, 'reload schema';
