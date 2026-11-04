-- These legacy clip-level engagement tables are no longer used by the active
-- Discover UI, which now reads aggregate reaction state through the safe RPC.
-- Both tables are empty in the live database. Preserve the tables and their data,
-- but remove public reads so member UUIDs cannot be enumerated through the API.

drop policy if exists "Public can read reactions on published clips"
  on public.discover_clip_reactions;

drop policy if exists "Public can read comments on published clips"
  on public.discover_clip_comments;

revoke select on table public.discover_clip_reactions
  from public, anon, authenticated;

revoke select on table public.discover_clip_comments
  from public, anon, authenticated;
