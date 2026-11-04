# Held Cinema migrations

Files in this directory are preserved proposals or migrations that are **not** present in the active Cinema database migration ledger. They are deliberately outside `supabase/migrations` so a normal `supabase db push` does not apply them automatically.

## Public Shorts view counter proposal

`20261104020000_public_cinema_short_views.sql` is held because it grants anonymous users permission to increment published Shorts view counts without authentication. The active database currently requires an authenticated user for `record_discover_clip_view` and grants execution only to `authenticated`.

Do not move this migration into the active migration directory until public view-count abuse controls and the intended anonymous-view policy have been reviewed.
