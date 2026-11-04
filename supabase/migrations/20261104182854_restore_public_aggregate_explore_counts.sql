-- Preserve public Explore like counts without exposing individual member IDs.
-- Anonymous viewers receive only the aggregate count; their personal-liked flag is false.
create or replace function public.get_discover_content_engagement(p_content_key text)
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
    count(*)::bigint as reaction_count,
    coalesce(bool_or(r.user_id = (select auth.uid())), false) as liked_by_current_user
  from public.discover_content_reactions r
  where r.content_key = p_content_key;
$function$;

grant execute on function public.get_discover_content_engagement(text) to anon, authenticated;
