-- Allow creator Shorts submissions to use an authorised YouTube URL instead of uploading a file.
alter table public.creator_short_submissions
  add column if not exists video_url text null;

alter table public.creator_short_submissions
  alter column video_path drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.creator_short_submissions'::regclass
      and conname = 'creator_short_submissions_video_source_check'
  ) then
    alter table public.creator_short_submissions
      add constraint creator_short_submissions_video_source_check
      check (
        (video_path is not null and video_url is null)
        or (video_path is null and video_url is not null)
      );
  end if;
end $$;

notify pgrst, 'reload schema';
