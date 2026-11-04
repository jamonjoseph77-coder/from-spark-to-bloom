-- Allow public Cinema visitors to contribute to aggregate Shorts view counts.
-- The function can only increment a published clip and exposes no user data.
create or replace function public.record_discover_clip_view(p_clip_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  update public.discover_clips
     set views_count = views_count + 1
   where id = p_clip_id
     and is_published = true
   returning views_count into next_count;

  if next_count is null then
    raise exception 'Published clip not found';
  end if;

  return next_count;
end;
$$;

revoke all on function public.record_discover_clip_view(uuid) from public, anon, authenticated;
grant execute on function public.record_discover_clip_view(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
