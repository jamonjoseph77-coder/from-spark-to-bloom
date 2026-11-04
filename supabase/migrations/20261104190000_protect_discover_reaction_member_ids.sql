-- Expose aggregate Explore reaction information without disclosing member UUIDs.
create or replace function public.get_discover_content_engagement(p_content_key text)
returns table (reaction_count bigint, liked_by_current_user boolean)
language sql
stable
security definer
set search_path = public, auth
as $function$
  select
    count(*)::bigint,
    coalesce(bool_or(user_id = auth.uid()), false)
  from public.discover_content_reactions
  where content_key = p_content_key;
$function$;

revoke all on function public.get_discover_content_engagement(text) from public, anon, authenticated;
grant execute on function public.get_discover_content_engagement(text) to anon, authenticated;

-- Reactions are still writable by authenticated members under their existing
-- ownership policies, but raw user IDs are no longer publicly selectable.
revoke select on table public.discover_content_reactions from public, anon, authenticated;
drop policy if exists "Anyone can read Explore content likes" on public.discover_content_reactions;

notify pgrst, 'reload schema';
