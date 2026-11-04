-- View counts should not modify the editorial updated_at timestamp used by publishers.
create or replace function public.record_discover_clip_view(p_clip_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
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
revoke all on function public.record_discover_clip_view(uuid) from public, anon;
grant execute on function public.record_discover_clip_view(uuid) to authenticated;
