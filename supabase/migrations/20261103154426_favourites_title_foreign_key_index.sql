-- Cover the remaining foreign key reported by the Supabase performance advisor.
-- Additive only: this does not alter rows, access policies, or application behaviour.
create index if not exists favourites_title_id_idx
  on public.favourites (title_id);

notify pgrst, 'reload schema';
