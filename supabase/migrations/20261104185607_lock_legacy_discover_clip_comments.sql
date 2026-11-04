-- The legacy clip-comments table has no active UI caller or records.
-- Remove its browser/API access rather than exposing author UUIDs through a public feed.
drop policy if exists "Public can read comments on published clips" on public.discover_clip_comments;
drop policy if exists "Signed-in viewers comment on published clips" on public.discover_clip_comments;
drop policy if exists "Viewers remove their own clip comments" on public.discover_clip_comments;
revoke all on table public.discover_clip_comments from public, anon, authenticated;

-- Public clip engagement is aggregate-only; anonymous viewers may see counts,
-- but no member identifiers or per-user reaction rows.
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
    and exists (
      select 1 from public.discover_clips c
      where c.id = p_clip_id and c.is_published = true
    );
$function$;

revoke all on function public.get_discover_clip_engagement(uuid) from public, anon, authenticated;
grant execute on function public.get_discover_clip_engagement(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
