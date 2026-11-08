-- Studio series episode schedule: supports full-season bulk delivery and gradual releases.
create table if not exists public.studio_title_submission_episodes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.studio_title_submissions(id) on delete cascade,
  season_number integer not null check (season_number > 0),
  episode_number integer not null check (episode_number > 0),
  episode_title text not null check (length(trim(episode_title)) between 1 and 180),
  synopsis text not null default '',
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  poster_url text,
  playback_url text,
  release_at timestamptz,
  delivery_status text not null default 'planned'
    check (delivery_status in ('planned','ready','delivered')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, season_number, episode_number)
);

create index if not exists studio_title_submission_episodes_schedule_idx
  on public.studio_title_submission_episodes (submission_id, release_at, season_number, episode_number);

alter table public.studio_title_submission_episodes enable row level security;

drop policy if exists "Studios and admins can view their episode schedules" on public.studio_title_submission_episodes;
create policy "Studios and admins can view their episode schedules"
on public.studio_title_submission_episodes
for select to authenticated
using (
  public.is_cinema_admin()
  or exists (
    select 1
    from public.studio_title_submissions s
    join public.studio_accounts a on a.id = s.studio_id
    where s.id = submission_id
      and a.owner_id = auth.uid()
      and a.verification_status = 'verified'
  )
);

drop policy if exists "Verified studios can manage their episode schedules" on public.studio_title_submission_episodes;
create policy "Verified studios can manage their episode schedules"
on public.studio_title_submission_episodes
for all to authenticated
using (
  exists (
    select 1
    from public.studio_title_submissions s
    join public.studio_accounts a on a.id = s.studio_id
    where s.id = submission_id
      and s.submitted_by = auth.uid()
      and a.owner_id = auth.uid()
      and a.verification_status = 'verified'
      and s.content_type = 'series'
  )
)
with check (
  exists (
    select 1
    from public.studio_title_submissions s
    join public.studio_accounts a on a.id = s.studio_id
    where s.id = submission_id
      and s.submitted_by = auth.uid()
      and a.owner_id = auth.uid()
      and a.verification_status = 'verified'
      and s.content_type = 'series'
  )
);

grant select, insert, update, delete on public.studio_title_submission_episodes to authenticated;
revoke all on public.studio_title_submission_episodes from anon;
