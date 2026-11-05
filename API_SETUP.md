# Cinema API and deployment setup

This guide records the integrations currently present, the required deployment configuration, and the remaining launch dependencies for Project Cinema.

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
| `KINOCHECK_API_KEY` | Optional KinoCheck trailer metadata integration | Secret |

### Lovable browser environment

Lovable's **More → Settings → Secrets** stores backend/runtime secrets. It rejects `VITE_` names because those values are embedded into the browser bundle at build time.

1. In the Lovable Code tab, create or edit the root-level file named exactly `.env` (beside `package.json`).
2. Put only these two public values in that file:
   - `VITE_SUPABASE_URL` = the existing Supabase project's Project URL.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = the project's Publishable key (`sb_publishable_...`) or legacy anon/public key.
3. Save the file, let Git sync complete, then publish again so the live build includes the values.

The tracked root `.env` is intentional for Lovable builds and must contain **only public browser configuration**. The current file was checked and contains only the two public Supabase browser values. These are not passwords and are visible in the delivered JavaScript bundle.

Keep `SUPABASE_SERVICE_ROLE_KEY`, Supabase secret keys (`sb_secret_...`), TMDB credentials, KinoCheck credentials, and all other private credentials out of `.env` and every `VITE_` variable. Store private runtime credentials in Lovable project Secrets or the appropriate server-side provider configuration. Non-prefixed `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are server-side settings and do not replace the two browser variables.

If a private credential is ever committed to Git history, rotate it in its provider dashboard. Removing a secret from the latest commit does not erase it from history. The current root `.env` inspection did not find a service-role key, TMDB token, or other private credential, so that file alone does not require secret rotation.

## Current integrations

### Supabase

The application uses `@supabase/supabase-js`. Browser configuration is read from `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; server-side code uses `SUPABASE_URL` and server-only credentials. The privileged client in `src/integrations/supabase/client.server.ts` bypasses row-level security and must only be imported inside trusted server handlers.

The active Cinema database currently has 29 public tables, with RLS enabled on all 29. The repository contains 30 migration files and the live database records the same 30 migration versions. Keep that match intact: add schema changes as reviewed migration files and compare the repository with the live migration ledger before deploying. Do not replay old SQL snippets or manually re-run an already-recorded migration.

One legacy clip-comments table is intentionally locked from browser access because the current application uses the newer Discover engagement tables instead. The aggregate engagement RPCs return counts and the current viewer's own state; they do not return other members' reaction IDs.

### TMDB

TMDB requests are proxied through `src/lib/tmdb.functions.ts`; credentials remain server-side. The client supports movie/series lists, genre filtering, search, detail records, and YouTube trailer metadata. The server filters TMDB records explicitly marked `adult: true` from list/search responses and rejects direct detail requests for those records.

This adult-flag filter is not a complete age-rating or parental-controls system. Country-specific age ratings, family settings, and content access controls remain future work.

TMDB metadata and trailers are discovery material only: they do not grant streaming rights. Before commercial launch, Cinema must obtain the appropriate TMDB commercial licence. TMDB's API FAQ distinguishes non-commercial use from commercial applications and requires attribution; keep the required TMDB notice/logo in an About or Credits area rather than the main Home or Player interface:
- [TMDB API FAQ and licensing](https://developer.themoviedb.org/docs/faq)

### Video delivery

The shared player uses the existing video player component and `hls.js` dependency for HLS where supported. Use only authorized, HTTPS media URLs supplied by a rights holder or licensed delivery provider.

Expected source formats:
- MP4: direct HTTPS media URL with an MP4 content type.
- HLS: HTTPS master playlist URL ending in `.m3u8`, with accessible variant playlists and segments.
- DASH: not yet implemented as a verified playback path; add a maintained DASH client and test browser/device support before advertising it.

The current player does not establish content rights, DRM entitlement, or a licensed catalogue. No full-film URLs should be inferred from TMDB, YouTube, or promotional metadata.

## Product capabilities that still need external systems or backend work

| Capability | Current state / required dependency |
|---|---|
| Live TV / TV Guide | No active channel/EPG provider is connected. Requires broadcaster agreements, channel feed URLs, EPG endpoint and programme schema. |
| Sports | No live fixtures/scores provider is connected. Requires a licensed sports data API, credentials, competition/team identifiers and usage terms. |
| News | Requires approved publisher feeds/API, attribution and image-use terms. |
| Authorized full playback | Requires rights-holder agreements, delivery provider, signed playback URLs, entitlement and DRM requirements. |
| Content rights and availability | No complete rights ledger yet. Needs territory, platform, start/end windows, exclusivity, permitted uses and contract/approval records. |
| Digital Box Office | Not implemented yet. Needs title/episode/event revenue attribution, campaign costs, contractual partner shares, rights-holder payouts, reconciliation and separate Cinema-wide reporting. |
| Watch-party synchronization | Room membership and chat exist; synchronized host play/pause/seek, canonical playback clock and reconnect handling are not implemented. |
| Content moderation and safety | Report/block flows and a complete moderation queue are not implemented. User-generated posts should not be opened widely until these controls and an admin review workflow are in place. |
| Age ratings / parental controls | The TMDB adult flag is only a first filter. Country-specific age ratings and parental settings remain to be implemented. |
| Email | Requires a transactional email provider and verified sending domain if Supabase email is not sufficient. |

Do not show invented scores, schedules, channels, viewing metrics, revenue, or sponsorship results when a provider is disconnected.

## Current content-data readiness

As checked against the active database on 2026-11-04:
- 1 title record exists, but none is published.
- 1 Discover clip is published.
- 1 creator-short submission is approved.
- 0 publisher records and 0 verified studio accounts exist.
- 0 Watch Parties and 0 Letterbox posts exist.

These counts describe the connected development database at the time of the audit; they are not product capacity limits. They do mean the full publisher, studio, live-TV, sports, Watch Party and Letterbox journeys still need realistic test data and end-to-end verification.

## Local verification

The package scripts are `dev`, `build`, `lint`, and `test`. The CI workflow also runs TypeScript checking and a Vite development-server stylesheet smoke test.

Use Bun, as CI does:

```sh
bun install
bun run lint
bun run test
bunx tsc --noEmit
bun run build
```

For the development stylesheet regression, CI starts Vite and requests the transformed `src/styles.css` directly. Keep that smoke test in place when editing global styles.

## Publishing and Preview verification

A Git commit or pull-request merge is not proof that the production site has been published. After a successful build and review:
1. Sync the connected `main` branch into Lovable.
2. Restart/refresh the Lovable Preview.
3. Test Home, Search, Discover, Shorts video and audio, My Cinema, Letterbox, Studios, Live TV, Sports and Watch Parties.
4. Check browser console and network errors, especially Supabase requests and media embeds.
5. Publish only after the Preview is verified.

The repository CI can verify build/type/test behaviour, but it cannot prove that the live Lovable Preview, provider secrets, media URLs, broadcaster feeds or rights agreements are configured correctly.

## Letterbox and Watch Parties

Letterbox supports text-first posts, title attachments, reactions and comments. Reaction counts are returned through aggregate functions; raw reaction rows are not publicly readable. Friends-only post visibility is also checked when inserting comments and reactions.

Before opening posting to a wider audience, Cinema still needs a complete report/block/moderation workflow and an administrator review interface. Letterbox does not enable arbitrary video uploads or private direct messages.

Watch Parties have room membership, realtime chat and quick reactions. Playback remains independent on each participant's device; synchronized playback has not yet been implemented.
