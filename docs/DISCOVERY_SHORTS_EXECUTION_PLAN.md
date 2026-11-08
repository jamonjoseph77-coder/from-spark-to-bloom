# Cinema Discovery & Shorts — Product Research And Execution Plan

**Status:** Active implementation plan  
**Product source of truth:** Cinema Master Blueprint, 27 October 2026  
**Implementation principle:** Preserve Cinema's television-first identity. Discovery must lead to a meaningful entertainment destination, not endless scrolling.

## 1. Blueprint requirements

The Master Blueprint defines these requirements:

- **Discovery is entertainment-led.** The feed may use a vertical, swipeable presentation, but it exists to connect people with entertainment and must not become the entire product (Master Blueprint, §§3.8–3.9, pp. 26–27; §4.4, pp. 34–35).
- **Approved supply.** Discovery can include official movie and series trailers, promotional clips, behind-the-scenes videos, interviews, entertainment news, approved commentary, sports highlights where rights permit, studio/broadcaster announcements, and original short-form entertainment from approved creators (§4.4, p. 34).
- **Direct viewing path.** Where the complete title is available on Cinema, Watch Now should open the relevant viewing experience. If it is not available, the interface must not imply that Cinema can play it; it should show useful information or authorised options (§4.5, pp. 35–36; §3.8, p. 26).
- **Easy exits.** People must be able to leave the feed for search, categories, My Cinema, live television, and other destinations (§3.8, p. 26).
- **My Cinema continuity.** My Cinema is the personal space for Continue Watching, Watchlist, Favourites, permitted downloads, followed studios/broadcasters/creators/teams/competitions, recently watched items, preferences and settings (§4.10, pp. 41–42).
- **Device fit.** Cinema prioritises Smart TV viewing with companion discovery and sharing experiences on phones and support for computers and other devices (§4.11, p. 42).
- **Rights and publisher controls.** Promotional permission is not the same as a licence to distribute the full film, programme, channel or event. Publishing is intended for authorised organisations and approved creators, not unrestricted uploads (Master Blueprint, §3.9, pp. 27–28; Revised Business Model Paper, §§4.3–4.4).

## 2. Current implementation findings

Repository inspection found these existing foundations:

- `DiscoverPage` already combines the Explore timeline, catalogue discovery, daily themes, seasonal collections and publisher tracking.
- `ExploreTimeline` combines public Letterbox posts, published clips and TMDB trailer previews.
- `DiscoverShorts` provides a dedicated horizontal Shorts shelf, while `ShortsPage` provides the immersive vertical viewer.
- `ShortViewer` already supports approved video playback, reactions, comments, saving the Short, and adding its linked title to the Watchlist.
- `SavedShortsShelf` already surfaces saved Shorts inside My Cinema.
- `clips.ts` validates playable Shorts, attaches related title metadata, ranks Shorts and persists user-owned saves.

The main journey gap addressed in this first implementation slice was that playable Shorts appeared in the mixed Explore timeline while a dedicated Shorts shelf also existed. This could repeat the same short in two places and weakened the distinction between short-form discovery and broader publisher/community activity. A second gap was that an unlinked Short had no clear route to explore related titles.

## 3. Product journey

The intended journey is:

1. **Discover:** Find a trailer, Short, publisher update, interview, approved clip or title-centred conversation.
2. **Understand:** See who published it, what it relates to, and whether the full title is available on Cinema.
3. **Watch:** If a linked Cinema title is available, use Watch Now to open its title/viewing route. If availability is not confirmed, use View Title or Explore Related Titles rather than a misleading playback promise.
4. **Save:** Save the Short to the user's saved Shorts collection and, where a linked title exists, add that title to the My Cinema Watchlist.
5. **Continue:** Return through My Cinema, followed publishers, Continue Watching or Recently Watched.

## 4. Implementation sequence

### Slice 1 — Connect Discovery and Shorts (in progress)

- Give Discover a dedicated Shorts shelf.
- Rank that shelf with the existing freshness/followed-publisher/diversity helper so the opening row is not just chronological and does not over-repeat one publisher.
- Provide a direct View All Shorts route from the shelf.
- Keep the mixed Explore timeline focused on posts, trailers and other publisher clips so Shorts are not duplicated.
- Make the Short viewer's primary title action availability-aware: Watch Now only when a playback source is present; otherwise View Title.
- When no Cinema title is linked, provide an Explore Related Titles route instead of a dead end.
- Preserve the existing immersive Shorts player, creator identity, reaction rail, comments, save, tracking and My Cinema integration.

### Slice 2 — Make the journey measurable and dependable

- Verify every published Short has a valid supported source, poster/fallback, publisher identity and optional linked title.
- Add journey tests for Discover shelf → viewer → title page → Watchlist and viewer → saved Shorts → My Cinema.
- Add clear loading, empty and recoverable error states without blocking other Discover sections.
- Add duplicate/repetition checks across the initial Shorts run and publisher mix.
- Verify mobile touch layout, safe-area spacing, portrait playback, keyboard access and reduced-motion behaviour.

### Slice 3 — Improve relevance without building an endless-scroll system

- Blend freshness, followed publishers, title affinity, viewer feedback and editorial ordering.
- Provide clear controls to follow/unfollow publishers and to refresh or leave the feed.
- Keep recommendation diversity and new-publisher discovery in the ranking.
- Avoid treating raw view counts as the only measure of quality.
- Keep optional local personalisation separate from account-owned saved content; explain and respect privacy choices.

### Slice 4 — Strengthen the My Cinema connection

- Make saved Shorts and saved full titles visibly distinct but connected.
- Add a clear route from each saved Short to its related title where one exists.
- Confirm save/remove state is consistent after refresh and between the Shorts viewer and My Cinema.
- Keep Continue Watching and Watchlist focused on actual Cinema titles, not external promotional embeds.

### Slice 5 — Publisher and rights readiness

- Keep public publishing restricted to approved creators and verified/authorised publishers.
- Record title association and source/usage permission as part of editorial publishing operations.
- Distinguish promotional embed permission from full-content playback rights.
- Do not surface sports highlights, programme clips or behind-the-scenes assets unless the relevant rights permit the use.
- Do not describe a YouTube embed or TMDB record as a Cinema streaming licence.

## 5. Research notes and technical constraints

### Recommendation architecture

Google's recommendation-systems overview describes a common three-stage architecture: candidate generation, scoring, and re-ranking. Cinema can apply this progressively without needing a complex machine-learning service at this stage:
- Candidate generation: only published, supported, rights-cleared items.
- Scoring: freshness, topic/title relevance, followed publishers and explicit viewer feedback.
- Re-ranking: creator diversity, content variety, freshness and reduced repetition.

Reference: https://developers.google.com/machine-learning/recommendation/overview/types

Netflix publicly describes using viewing interactions, title metadata, similar audience patterns, language and device context to personalise recommendations. Its help material also describes ranking both rows and titles within rows. Cinema should take the product lesson—use relevant signals and make search available—without copying a subscription-first business model or opaque retention tactics.

References:
- https://help.netflix.com/en/node/100639/
- https://about.netflix.com/en/news/introducing-ai-discover

### External video playback

YouTube's official IFrame Player documentation defines the supported embed parameters and notes minimum player viewport requirements. Its API documentation also describes playback controls and events, including cases where browser autoplay restrictions block scripted playback. Cinema should therefore use a user-initiated playback path, preserve native YouTube player controls/branding requirements, and provide a clear fallback when an embed cannot play.

References:
- https://developers.google.com/youtube/player_parameters
- https://developers.google.com/youtube/iframe_api_reference
- https://support.google.com/youtube/answer/171780

### Rights and commercial separation

The Master Blueprint and Revised Business Model Paper require approved content supply and clear rights boundaries. A trailer, clip or YouTube embed is promotional/discovery material; it does not create permission to stream the underlying full title on Cinema. Digital Box Office reporting and sponsorship should remain distinct from personal viewing-history data.

## 6. Acceptance criteria

A slice is not considered complete merely because the interface renders. The journey must be verified:

- No duplicate Short appears in both the dedicated Shorts shelf and the mixed Explore timeline.
- A published Short opens the intended viewer and has a valid playable source.
- A linked, playable Cinema title has a prominent Watch Now action.
- A linked title without confirmed playback availability is labelled View Title, not falsely promised as immediately playable.
- An unlinked Short has a useful Explore Related Titles path.
- Save Short persists and appears in My Cinema after refresh.
- Add To My Cinema updates the linked title's Watchlist state.
- Failed Shorts loading does not prevent other Discover content from rendering.
- Publisher identity and approval/rights rules remain intact.
- The experience remains easy to exit for Search, Movies, Series, Live TV, Sports and My Cinema.

## 7. What this plan deliberately does not do

- It does not turn Cinema into a TikTok clone or make endless scrolling the core product.
- It does not introduce unrestricted public uploads or unmoderated posting.
- It does not invent a new content API, assume YouTube embeds grant streaming rights, or bypass publisher restrictions.
- It does not change the database schema in this first slice.
- It does not alter the Digital Box Office, monetisation strategy, or the removed Cinema Exchange concept.
- It does not claim the Lovable preview or live deployment has been verified.
