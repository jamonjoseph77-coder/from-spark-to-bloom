-- Connect approved studio series schedules to public catalogue titles and viewer follows.
alter table public.studio_title_submissions
  add column if not exists published_title_id uuid references public.titles(id) on delete set null;

create unique index if not exists studio_title_submissions_published_title_uidx
  on public.studio_title_submissions (published_title_id)
  where published_title_id is not null;

drop policy if exists "Audience can view approved mapped series schedules" on public.studio_title_submission_episodes;
create policy "Audience can view approved mapped series schedules"
on public.studio_title_submission_episodes
for select to anon, authenticated
using (
  exists (
    select 1
    from public.studio_title_submissions s
    join public.titles t on t.id = s.published_title_id
    where s.id = submission_id
      and s.status = 'approved'
      and s.content_type = 'series'
      and t.type = 'series'
      and t.is_published = true
  )
);
grant select on public.studio_title_submission_episodes to anon, authenticated;

create table if not exists public.series_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  followed_at timestamptz not null default now(),
  primary key (user_id, title_id)
);
create index if not exists series_follows_title_idx on public.series_follows (title_id, followed_at desc);
alter table public.series_follows enable row level security;
grant select, insert, delete on public.series_follows to authenticated;
revoke all on public.series_follows from anon;

drop policy if exists "Members read their series follows" on public.series_follows;
create policy "Members read their series follows"
on public.series_follows for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Members follow published series" on public.series_follows;
create policy "Members follow published series"
on public.series_follows for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.titles t
    where t.id = title_id and t.type = 'series' and t.is_published = true
  )
);

drop policy if exists "Members unfollow their series" on public.series_follows;
create policy "Members unfollow their series"
on public.series_follows for delete to authenticated
using ((select auth.uid()) = user_id);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type = any (array[
    'friend_request','friend_accepted','post_reaction','post_comment',
    'watch_party_joined','watch_party_live','series_episode_scheduled'
  ]::text[]));

create or replace function public.cinema_notify_series_episode_schedule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_title_id uuid;
  v_series_title text;
  v_body text;
begin
  if new.release_at is null then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.release_at is not distinct from new.release_at
     and old.episode_title is not distinct from new.episode_title
     and old.season_number is not distinct from new.season_number
     and old.episode_number is not distinct from new.episode_number then
    return new;
  end if;

  select s.published_title_id, t.title
    into v_title_id, v_series_title
  from public.studio_title_submissions s
  join public.titles t on t.id = s.published_title_id
  where s.id = new.submission_id
    and s.status = 'approved'
    and s.content_type = 'series'
    and t.type = 'series'
    and t.is_published = true;

  if v_title_id is null then
    return new;
  end if;

  v_body := 'S' || new.season_number::text || ' · E' || new.episode_number::text
    || ' — ' || new.episode_title || ' is scheduled for '
    || to_char(new.release_at at time zone 'UTC', 'Mon DD, YYYY "at" HH24:MI')
    || ' UTC.';

  insert into public.notifications (user_id, actor_id, type, title, body, href)
  select f.user_id, null, 'series_episode_scheduled',
    'A New Episode Is Scheduled',
    v_series_title || ': ' || v_body,
    '/title/' || v_title_id::text
  from public.series_follows f
  where f.title_id = v_title_id
    and f.user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);

  return new;
end;
$function$;

revoke all on function public.cinema_notify_series_episode_schedule() from public, anon, authenticated;

drop trigger if exists cinema_series_episode_schedule_notification on public.studio_title_submission_episodes;
create trigger cinema_series_episode_schedule_notification
after insert or update of release_at, episode_title, season_number, episode_number
on public.studio_title_submission_episodes
for each row execute function public.cinema_notify_series_episode_schedule();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'series_follows'
     ) then
    alter publication supabase_realtime add table public.series_follows;
  end if;
end
$$;
