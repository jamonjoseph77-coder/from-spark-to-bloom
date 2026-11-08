-- Studio-to-Cinema full-title distribution intake.
-- Submission records are private until Cinema reviews them. Approval is not
-- equivalent to publication: administrators still create/schedule catalogue titles.

create table if not exists public.studio_title_submissions (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studio_accounts(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('movie', 'series', 'sport', 'news', 'live')),
  title text not null check (length(btrim(title)) between 1 and 180),
  synopsis text not null check (length(btrim(synopsis)) between 20 and 5000),
  genre text not null default '',
  release_year integer check (release_year is null or release_year between 1888 and 2200),
  duration_minutes integer check (duration_minutes is null or duration_minutes between 1 and 10000),
  poster_url text not null check (poster_url ~* '^https://'),
  backdrop_url text check (backdrop_url is null or backdrop_url ~* '^https://'),
  trailer_url text check (trailer_url is null or trailer_url ~* '^https://'),
  playback_url text check (playback_url is null or playback_url ~* '^https://'),
  rights_holder text not null check (length(btrim(rights_holder)) between 2 and 180),
  rights_basis text not null check (rights_basis in ('owned', 'exclusive_license', 'non_exclusive_license', 'distribution_agreement', 'commissioned', 'other_authorised')),
  territories text[] not null check (cardinality(territories) > 0),
  languages text[] not null check (cardinality(languages) > 0),
  platforms text[] not null check (cardinality(platforms) > 0),
  rights_start date,
  rights_end date,
  is_exclusive boolean not null default false,
  promotional_rights_confirmed boolean not null default false,
  rights_evidence_url text check (rights_evidence_url is null or rights_evidence_url ~* '^https://'),
  delivery_notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'changes_requested', 'approved', 'rejected')),
  review_note text not null default '',
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_title_submission_rights_window check (rights_start is null or rights_end is null or rights_end >= rights_start)
);

create index if not exists studio_title_submissions_studio_created_idx
  on public.studio_title_submissions (studio_id, created_at desc);
create index if not exists studio_title_submissions_status_created_idx
  on public.studio_title_submissions (status, created_at desc);

alter table public.studio_title_submissions enable row level security;

grant select, insert, update on public.studio_title_submissions to authenticated;

create policy "Studios can submit titles from verified accounts"
  on public.studio_title_submissions
  for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and exists (
      select 1 from public.studio_accounts s
      where s.id = studio_id
        and s.owner_id = (select auth.uid())
        and s.verification_status = 'verified'
    )
  );

create policy "Studios and Cinema admins can view title submissions"
  on public.studio_title_submissions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.studio_accounts s
      where s.id = studio_id and s.owner_id = (select auth.uid())
    )
    or (select public.is_cinema_admin())
  );

create policy "Cinema admins can review title submissions"
  on public.studio_title_submissions
  for update
  to authenticated
  using ((select public.is_cinema_admin()))
  with check ((select public.is_cinema_admin()));

comment on table public.studio_title_submissions is
  'Private studio title distribution submissions. Approval does not publish a title; Cinema separately creates and schedules catalogue entries.';
