-- Return only aggregate Explore reaction data to the signed-in viewer.
-- Do not expose the user_id rows through the public Data API.

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
  where r.content_key = p_content_key
    and (select auth.uid()) is not null;
$function$;

revoke all on function public.get_discover_content_engagement(text) from public, anon, authenticated;
grant execute on function public.get_discover_content_engagement(text) to authenticated;

drop policy if exists "Anyone can read Explore content likes"
  on public.discover_content_reactions;

create policy "Members can read their own Explore content likes"
  on public.discover_content_reactions
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke select on public.discover_content_reactions from anon;
grant select on public.discover_content_reactions to authenticated;

notify pgrst, 'reload schema';
