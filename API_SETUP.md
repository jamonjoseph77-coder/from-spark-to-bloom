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

### Lovable project Secrets — required Supabase setup

For the browser application, add these exact names under **More → Secrets** in the Lovable project:

- `VITE_SUPABASE_URL` = the existing Supabase project's **Project URL**.
- `VITE_SUPABASE_PUBLISHABLE_KEY` = the existing Supabase project's **Publishable key** (the public `sb_publishable_...` key, or the project's anon/public key if it uses the legacy key format).

The `VITE_` prefix is required because Vite embeds these public configuration values into the browser build. The non-prefixed `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` names are separate server-side settings; adding only those does not configure the browser bundle. After changing project Secrets, publish/update the app again so the new build receives them.

Only a Supabase publishable/anon key may be exposed to the browser. Never put `SUPABASE_SERVICE_ROLE_KEY`, a Supabase secret key (`sb_secret_...`), or any other privileged credential in a `VITE_` variable.

Do not prefix secrets with `VITE_`. The service-role key must never enter browser code, client bundles, logs, or chat messages.

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
