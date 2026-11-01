# Cinema API and deployment setup

This document describes the integrations present in the repository and the external services still required. A configured variable does not by itself mean a provider, licence, or live feed is active.

## Environment variables

Copy `.env.example` to `.env.local` for local development. Never commit `.env.local`, production credentials, access tokens, or service-role keys.

| Variable | Used by | Exposure |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser Supabase client | Public configuration |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser Supabase client | Publishable/anon key only |
| `SUPABASE_URL` | Server-side Supabase clients | Server environment |
| `SUPABASE_PUBLISHABLE_KEY` | Server SSR client configuration | Server environment |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-only Supabase client | Secret; bypasses RLS |
| `TMDB_READ_ACCESS_TOKEN` | Server-side TMDB API | Secret |
| `TMDB_API_KEY` | Server-side TMDB API fallback | Secret |

### Lovable browser environment — required Supabase setup

Lovable's **More → Settings → Secrets** stores backend/runtime secrets. It rejects `VITE_` names because those values are embedded into the browser bundle at build time.

1. In the Lovable Code tab, create or edit the root-level file named exactly `.env` (beside `package.json`).
2. Put only these two public values in that file:
   - `VITE_SUPABASE_URL` = the existing Supabase project's **Project URL**.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = the project's **Publishable key** (`sb_publishable_...`) or legacy anon/public key.
3. Save the file, let Git sync complete, then publish again so the live build includes the values.

The repository tracks the root `.env` specifically because Lovable reads it during preview and production builds. Keep `.env.local` and other local variants out of Git. The root `.env` must contain **only public browser configuration**; its values are visible in the delivered JavaScript bundle and are not passwords.

Keep `SUPABASE_SERVICE_ROLE_KEY`, Supabase secret keys (`sb_secret_...`), TMDB credentials, and all other private credentials out of `.env` and any `VITE_` variable. Store private runtime credentials in Lovable project Secrets or the appropriate server-side provider configuration. Non-prefixed `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are server-side settings and do not replace the two browser variables.

## Current integrations

### Supabase
The application uses `@supabase/supabase-js`. Browser configuration is read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; server-side code uses `SUPABASE_URL` and server-only credentials. The privileged client in `src/integrations/supabase/client.server.ts` bypasses row-level security and must only be imported inside trusted server handlers.

Configure the existing Lovable Cloud/Supabase project and retain its current database. Do not run migrations or import data without a reviewed backup, schema comparison, and explicit owner-approved migration plan.

### TMDB
TMDB requests are proxied through `src/lib/tmdb.functions.ts`; credentials remain server-side. The client supports movie/series lists, genre filtering, search, detail records, and YouTube trailer metadata. TMDB metadata and trailers are discovery material only: they do not grant streaming rights.

TMDB response shapes used by the client:
- List/search: `{ results: [{ id, title | name, overview, release_date | first_air_date, vote_average, poster_path, backdrop_path }] }`
- Details: the same title fields plus `genres`, `runtime`, `episode_run_time`, `number_of_seasons`, `number_of_episodes`, `tagline`, `status`, and `videos.results`.
- Trailer records are accepted only when `site` is YouTube and the type is Trailer, Teaser, or Clip.

### Video delivery
The shared player uses the existing video player component and `hls.js` dependency for HLS where supported. Use only authorized, HTTPS media URLs supplied by a rights holder or licensed delivery provider. Expected source formats:
- MP4: direct HTTPS media URL with an MP4 content type.
- HLS: HTTPS master playlist URL ending in `.m3u8`, with accessible variant playlists and segments.
- DASH: not yet implemented as a verified playback path; add a maintained DASH client and test browser/device support before advertising it.

The current player does not establish content rights, DRM entitlement, or a licensed catalogue. No full-film URLs should be inferred from TMDB or YouTube.

## External integrations not yet connected

| Capability | Required provider input |
|---|---|
| Live TV / TV Guide | Broadcaster agreements, channel feed URLs, EPG endpoint and programme schema |
| Sports | Licensed fixtures/scores/highlights API, API credentials, competition/team identifiers |
| News | Approved publisher feeds/API, attribution and image-use terms |
| Authorized full playback | Rights-holder agreements, delivery provider, signed playback URLs, entitlement and DRM requirements |
| Watch-party synchronization | Realtime backend events for host play/pause/seek, canonical playback clock and reconnect handling |
| Email | Transactional email provider and verified sending domain if Supabase email is not sufficient |
| Analytics / Digital Box Office | Defined event taxonomy, consent/privacy rules, attribution logic and verified commercial data sources |

Do not show invented scores, schedules, channels, viewing metrics, revenue, or sponsorship results when a provider is disconnected.

## Local verification

Use the scripts defined in `package.json`:
```sh
npm install
npm run lint
npm test
npm run build
```
There is no separate `typecheck` script currently. Run `npx tsc --noEmit` only after confirming the repository's TypeScript configuration and generated TanStack route types.

## Publishing

This repository is connected to Lovable. Its README describes commits to the connected branch syncing into the Lovable editor. A Git commit or pull-request merge is not proof that the production site has been published. After a successful build and review, use the project's authorized deployment/publish workflow and verify the live URL.

## Credential exposure response

A `.env` file was present in the public Git repository. Removing it from the current branch does not erase it from Git history or revoke its values. Treat any credential in that file as exposed: rotate/revoke relevant TMDB credentials and any Supabase secret/service-role credentials in the provider dashboard, then update the deployment secrets. Do not paste the old or replacement values into chat or commit them.


## Cinema Letterbox and studio verification

The Letterbox social experience adds a database migration:

- `supabase/migrations/20261101000100_letterbox_social_and_studio_verification.sql`

Before publishing the updated application, apply this migration to the same Supabase project used by Cinema. In Supabase Dashboard, open **SQL Editor**, create a new query, paste the migration contents from the repository, and run it. Do not publish the Letterbox frontend before the migration has completed successfully.

The migration creates:
- `letterbox_posts` for entertainment-centred text posts and title links.
- `letterbox_reactions` for one reaction per user per post.
- `letterbox_comments` for replies.
- `studio_accounts` for official studio verification applications and verified status.

Row-level security is enabled. Studio verification is not self-service: applications start as pending, and only an account passing the existing `is_cinema_admin()` check can change verification status. A badge appears only for records marked verified.

The current Letterbox implementation supports text-first posts, title attachments, reactions, comments and realtime refresh. It does not enable arbitrary video uploads or private direct messages. Before opening posting to a wider audience, Cinema still needs a complete report/block/moderation workflow and an administrator review interface.

Watch Parties have room membership, realtime chat and quick reactions. Playback remains independent on each participant's device; synchronised playback has not yet been implemented.
