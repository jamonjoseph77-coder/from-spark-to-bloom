-- Creator Shorts are uploaded into a public playback bucket but remain private to the
-- submitting creator and Cinema administrators until reviewed.
create table if not exists public.creator_short_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  headline text not null check (char_length(headline) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  publisher_name text not null check (char_length(publisher_name) between 1 and 120),
  video_path text not null,
  poster_path text null,
  title_id uuid null references public.titles(id) on delete set null,
  duration_seconds integer null check (duration_seconds is null or duration_seconds between 1 and 90),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz null
);
create index if not exists creator_short_submissions_review_idx
  on public.creator_short_submissions(status, created_at desc);
create index if not exists creator_short_submissions_owner_idx
  on public.creator_short_submissions(user_id, created_at desc);

alter table public.creator_short_submissions enable row level security;
grant select, insert on public.creator_short_submissions to authenticated;
grant update on public.creator_short_submissions to authenticated;

drop policy if exists "Creators read own Shorts submissions" on public.creator_short_submissions;
create policy "Creators read own Shorts submissions"
  on public.creator_short_submissions for select to authenticated
  using (user_id = auth.uid() or public.is_cinema_admin());

drop policy if exists "Creators submit own Shorts" on public.creator_short_submissions;
create policy "Creators submit own Shorts"
  on public.creator_short_submissions for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null);

drop policy if exists "Cinema admins review creator Shorts" on public.creator_short_submissions;
create policy "Cinema admins review creator Shorts"
  on public.creator_short_submissions for update to authenticated
  using (public.is_cinema_admin()) with check (public.is_cinema_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('cinema-shorts', 'cinema-shorts', true, 104857600, array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']),
  ('cinema-creator-submissions', 'cinema-creator-submissions', false, 104857600, array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can play approved creator Shorts" on storage.objects;
create policy "Public can play approved creator Shorts"
  on storage.objects for select to public
  using (bucket_id = 'cinema-shorts');

drop policy if exists "Creators upload private Shorts submissions" on storage.objects;
create policy "Creators upload private Shorts submissions"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'cinema-creator-submissions' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Creators and admins read private Shorts submissions" on storage.objects;
create policy "Creators and admins read private Shorts submissions"
  on storage.objects for select to authenticated
  using (bucket_id = 'cinema-creator-submissions' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_cinema_admin()));

drop policy if exists "Cinema admins manage public Shorts files" on storage.objects;
create policy "Cinema admins manage public Shorts files"
  on storage.objects for all to authenticated
  using (bucket_id = 'cinema-shorts' and public.is_cinema_admin())
  with check (bucket_id = 'cinema-shorts' and public.is_cinema_admin());
