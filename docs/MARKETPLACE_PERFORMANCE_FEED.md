# Cinema first-party performance feed — integration contract

## Purpose

Provide Cinema Presence Marketplace with aggregate, title-level first-party performance data. The feed must not expose viewer identities, profiles, watch histories, or individual event rows.

## Existing data and its limits

Cinema currently stores a latest-state `watch_progress` record per user/content item with `user_id`, `content_id`, `title_id`, `position_seconds`, `duration_seconds`, `completed`, and `updated_at`.

This is useful for progress and completion-state summaries, but it is **not** a playback event stream:
- It does not count every playback start or impression.
- Position is the latest saved position, not cumulative watch time.
- It does not provide a reliable session count or repeat-view count.
- The current record has no country/region field.
- It cannot prove a sponsored placement was rendered or seen.

Do not relabel these fields as views, watch time, regional demand or campaign impressions.

## Required event model for full performance reporting

A future first-party event collector should record only the minimum event data needed:
- event type: playback_started, playback_heartbeat, playback_completed, title_saved, title_shared, placement_rendered, placement_clicked;
- canonical Cinema title ID (episode events also include parent title ID);
- event timestamp and a random session identifier;
- coarse country only where legally and technically appropriate and disclosed;
- placement/campaign ID only for approved commercial placements.

Do not collect raw IP addresses, precise location, viewer names, email addresses, or sensitive personal traits for this reporting feed. Do not send watch history to the Marketplace.

## Aggregated Marketplace response

The external feed should return aggregate rows only:
- title ID, reporting period, unique engaged viewers, playback starts, completed sessions, completion rate, total measured watch seconds, saves, shares;
- country-level aggregates only after country attribution is lawfully implemented and minimum cohort thresholds are met;
- placement impressions/clicks only from explicit placement_rendered / placement_clicked events.

Each response must include generated_at, period_start, period_end, source, event_count, and data-quality status. Suppress small cohorts and never include user_id or content-level viewer records.

## Authentication and operational safeguards

- Marketplace calls the Cinema server endpoint using a dedicated server-side bearer token.
- The token is stored only as a hosting secret on both sides; never in client JavaScript, repository files or browser storage.
- The endpoint uses the existing server-side Supabase admin client, but returns aggregates only.
- Rate limit requests, validate period and title filters, and log access without logging the bearer token.
- The feed is read-only. It must not modify titles, users, watch progress, rights, or playback.
- No migration or production database schema change is authorised by this document.

## Delivery sequence

1. Instrument the Cinema player to emit trustworthy playback events.
2. Decide on an approved event persistence location and retention policy.
3. Implement aggregate-only server export.
4. Connect Marketplace through its server runtime, never directly from the browser.
5. Validate counts against controlled test sessions before enabling brand-facing metrics.

Until steps 1–4 are implemented and validated, Marketplace must show "Awaiting Verified Cinema Data" rather than invented or proxy performance metrics.


## Implemented first phase

A read-only server route is added at `/api/marketplace-performance`. It requires the server-side `CINEMA_MARKETPLACE_ANALYTICS_TOKEN` bearer secret and uses the existing server-only Supabase admin client to read existing records. It returns aggregate saved-progress indicators only and suppresses title cohorts below five engaged accounts. It does not expose individual viewer rows.

The route does not create or update database tables, policies, titles, user records or watch-progress records. It is not a full playback analytics feed. The endpoint's `metricType` explicitly identifies the response as saved progress state, not playback events.

Before the endpoint can serve Marketplace requests, configure the token in official Cinema hosting and the matching server-side token plus endpoint URL in Marketplace hosting. The token must never be exposed to browser code or committed to the repository.

Full performance metrics remain pending:
- playback starts and qualified views;
- cumulative watch time from playback heartbeats;
- repeat sessions;
- country-level aggregates;
- sponsored placement impressions and clicks.

Those require player and placement event instrumentation plus an approved persistence and retention design. Do not infer them from saved progress.


## Signed proof for sponsorship placement events

The official Cinema server forwarder accepts the short-lived opaque `trackingToken` returned by Marketplace `GET /api/ads/serve` for each eligible placement. For placement event types, the forwarder also carries the matching campaign ID, placement ID and optional collection ID. The Marketplace receiver verifies the HMAC-signed token, expiry, allowed Cinema origin, campaign ID, title/collection scope and placement before storing the event. Caller-supplied campaign IDs alone are not proof that a placement was actually served.

The tracking token is an impression-scoped signed proof, not the Marketplace server credential. The separate `CINEMA_MARKETPLACE_ANALYTICS_TOKEN` remains server-only and is never sent to browser code. No browser event producers are enabled by this change.


## Explicit measurement consent

The official Cinema app now exposes a Privacy Choices dialog. Optional Marketplace measurement remains disabled until the user explicitly allows it. The choice is stored in a signed, HttpOnly, SameSite cookie; browser JavaScript cannot read or forge the grant. Rejecting measurement stores a denial state and the forwarding endpoint refuses events unless a valid signed grant is present.

The grant cookie is HMAC-signed with the server-only `CINEMA_MARKETPLACE_ANALYTICS_TOKEN`. That secret must be at least 32 characters and remain only in server hosting configuration. The browser never receives it. Users can change their choice from the Privacy Choices control in the Cinema top bar.

This consent interface does not enable event producers. Before activation, configure host-level rate limiting, verify the Marketplace Firestore TTL policy, confirm the production origin allowlist, and complete controlled end-to-end tests. No viewer identity or individual viewing history is sent to Marketplace.
