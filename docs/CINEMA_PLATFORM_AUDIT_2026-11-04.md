# Project Cinema Platform Audit — 2026-11-04

## Scope and verification limits

This is a focused audit of the current application code, recent pull requests, the active Supabase project, database schema/RLS, migration history, and the official Cinema Blueprint and revised Business Model Paper.

The historical PR records from #1 through #113 were reviewed, but this was not a line-by-line re-review of every historical diff. The current code and high-risk paths were prioritized. GitHub CI can verify source/build behaviour; it cannot verify the Lovable Preview UI, live media embeds, external provider credentials, broadcaster permissions or content licences. No claim of visual Preview verification is made here.

## Verified technical improvements merged

- Fixed the invalid global CSS selector that caused Vite/Lightning CSS to fail while transforming `src/styles.css`; added a development-server stylesheet smoke test.
- Added an upper bound to initial Supabase session restoration so a stalled auth restore cannot hold the app on an indefinite loading screen.
- Refined the Shorts viewer/player presentation and sound controls, including preserving the last audible volume when unmuting.
- Hardened browser auth-storage fallback so blocked `localStorage` does not break the auth adapter.
- Restricted friendship updates to the permitted status/timestamp columns, preventing clients from rewriting friendship identity columns.
- Tightened default database privileges and preserved RLS on public tables.
- Changed public Discover/Letterbox reaction reads to aggregate-only responses; raw reaction rows no longer expose other members' IDs.
- Added visibility checks when inserting Letterbox comments/reactions, so a user cannot interact with a friends-only post they cannot view.
- Locked the unused legacy clip-comments table from browser access.
- Added a server-side TMDB adult-flag filter for list/search results and direct detail requests.
- Reconciled repository migration filenames with the active Supabase migration ledger.

## Current database state

- 29 public tables; RLS is enabled on all 29.
- 89 RLS policies across 28 tables. The remaining table, `discover_clip_comments`, is intentionally inaccessible to browser roles and has no RLS policies.
- 30 migration files in the repository match the 30 versions recorded in the live database.
- Security advisors still report leaked-password protection disabled. Enable it in Supabase Dashboard under Authentication / Password Security.
- Security advisors flag several `SECURITY DEFINER` functions callable by anonymous or authenticated users. The reviewed public functions are aggregate engagement endpoints that return counts/current-viewer state, not raw member identifiers. Membership/admin functions remain intentionally callable for their specific application flows and must retain their restricted grants and safe search paths.
- Performance advisors list 30 unused indexes. Do not remove them solely on this report: this database has very low activity, so usage counters are not yet representative.

## Connected development data as of this audit

| Area | Current records |
|---|---:|
| Titles | 1 total; 0 published |
| Discover clips | 1 published |
| Creator-short submissions | 1 approved |
| Publishers | 0 |
| Verified studio accounts | 0 |
| Watch Parties | 0 |
| Letterbox posts | 0 |

These are the connected development database counts, not capacity limits. They show that publisher/studio onboarding and end-to-end content journeys have not yet been exercised with realistic catalogue data.

## Gaps against the official Cinema product papers

The Blueprint and Business Model Paper describe a television destination built around licensed content delivery and a Digital Box Office—not merely a metadata catalogue or generic social feed.

1. **Digital Box Office is not implemented.** The app does not yet have the title/episode/event revenue ledger, campaign cost tracking, contractual partner allocations, rights-holder payout/reconciliation workflow, or separate reporting for title-level versus Cinema-wide revenue.
2. **Rights and availability management is not implemented.** There is no complete title-level model for territory, platform, start/end windows, exclusivity, permitted uses, rights-holder agreements and playback entitlements.
3. **Live TV is not connected to a broadcaster/EPG provider.** A navigation destination is not a working channel catalogue or live feed.
4. **Sports data is not connected to a licensed fixtures/scores provider.** Do not present placeholder schedules or scores as live data.
5. **Watch Party synchronization is not implemented.** Membership and chat exist, but participants' playback is independent.
6. **User-generated content moderation is incomplete.** Report/block controls and a full moderation queue are required before broad public posting. The current Letterbox post workflow is not a substitute for moderation.
7. **Age ratings and parental controls are incomplete.** The TMDB adult flag is a useful filter, not a full country-specific rating system or parental-control experience.
8. **Licensed playback and DRM entitlements are not established.** TMDB metadata and YouTube promotional embeds do not grant rights to stream films or episodes.
9. **Production monitoring and operational alerting have not been verified.** CI is present; production observability, incident response and provider health checks need a separate setup.
10. **Content supply is not yet populated.** There are no publisher records or verified studios in the connected database and only one published short.

## Commercial and provider constraints

TMDB's official API FAQ distinguishes non-commercial use from commercial applications and requires attribution. Because Cinema's business model is commercial, the appropriate TMDB commercial licence must be obtained before launch. The required notice/logo can live in an About/Credits area rather than the main Home or Player interface. TMDB data is metadata, not playback rights.

The official Blueprint requires rights-holder agreements and controlled availability. The Business Model Paper describes Digital Box Office tracking of revenue opportunities attributable to individual properties, costs, partner allocations and rights-holder payouts. Those are product requirements, not optional analytics polish.

## Priority order

1. Enable Supabase leaked-password protection in the dashboard.
2. Complete moderation/report/block and admin review before widening user-generated posting.
3. Design and implement rights/territory/windows and playback entitlement records.
4. Build the Digital Box Office ledger, attribution, partner settlement and reporting.
5. Integrate licensed Live TV/EPG and Sports data providers.
6. Implement synchronized Watch Party playback.
7. Add country-specific content ratings and parental controls.
8. Configure production monitoring, alerts and incident response.
9. Populate the catalogue through verified publishers/studios and test complete viewing journeys.

## Final status

Cinema's codebase has had several important reliability and privacy issues corrected, and the repository/database migration history is aligned. The current application is still a development-stage foundation, not a launch-ready licensed television service. The next major work should prioritize rights, moderation, Digital Box Office and real content/provider integrations while preserving the product's television-first direction.
