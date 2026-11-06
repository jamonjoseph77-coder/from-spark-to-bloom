-- Store a small, pre-compressed member profile image.
-- The application limits uploads to a 160x160 WebP data URL below 32 KB.
-- Existing profile visibility and owner-only write policies remain unchanged.
alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is
  'Optional compressed profile image data URL; application enforces a 32 KB limit.';
