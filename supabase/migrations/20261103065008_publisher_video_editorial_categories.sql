-- Expand publisher video classification for official title extras.
-- Existing records keep their current kind and remain readable.
alter table public.discover_clips
  drop constraint if exists discover_clips_kind_check;

alter table public.discover_clips
  add constraint discover_clips_kind_check
  check (kind in (
    'trailer',
    'short',
    'clip',
    'featured',
    'behind_the_scenes',
    'interview',
    'making_of',
    'deleted_scene',
    'cast_featurette',
    'production_diary'
  ));

create index if not exists discover_clips_title_kind_published_idx
  on public.discover_clips (title_id, kind, is_published, sort_order);
