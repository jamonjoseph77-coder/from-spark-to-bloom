-- Friend activity is shared only when the member explicitly opts in.
alter table public.profiles
  add column if not exists share_watching_activity boolean not null default false;

create index if not exists publisher_follows_user_publisher_idx
  on public.publisher_follows (user_id, publisher_name);

drop policy if exists "Friends can read shared publisher follows" on public.publisher_follows;
create policy "Friends can read shared publisher follows"
  on public.publisher_follows for select to authenticated
  using (
    exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = publisher_follows.user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = publisher_follows.user_id)
        )
    )
  );

drop policy if exists "Friends can read opted-in watch activity" on public.watch_progress;
create policy "Friends can read opted-in watch activity"
  on public.watch_progress for select to authenticated
  using (
    updated_at >= now() - interval '20 minutes'
    and completed = false
    and exists (
      select 1
      from public.profiles p
      join public.friendships f
        on f.status = 'accepted'
       and (
         (f.requester_id = auth.uid() and f.addressee_id = p.user_id)
         or (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
       )
      where p.user_id = watch_progress.user_id
        and p.share_watching_activity = true
    )
  );

alter table public.discover_clips
  add column if not exists views_count bigint not null default 0;

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
     set views_count = views_count + 1,
         updated_at = now()
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
