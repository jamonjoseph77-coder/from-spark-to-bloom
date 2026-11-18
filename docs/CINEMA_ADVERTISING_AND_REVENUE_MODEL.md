# Cinema Advertising And Revenue Model

## Purpose
Cinema is a digital entertainment home built around stories. The model should let people discover and watch authorised stories without viewer subscriptions, pay-per-title checkout, intrusive advertising, or mid-roll interruptions. This is a planning document, not evidence of an active account, advertiser, campaign, licensing agreement, or revenue.

## 1. Core principle
A title becoming available on Cinema does not, by itself, generate revenue. It creates watchable inventory and an opportunity to earn revenue when Cinema has the necessary rights, the rights agreement permits the relevant commercial activity, an advertising campaign or demand is active, a user sees a valid measurable placement, and the campaign is paid under its agreed terms.

## 2. Two revenue channels

### A. Programmatic advertising
Use an advertising network to sell standard, clearly labelled placements through automated advertiser demand. Advertisers buy through an auction; Cinema receives the publisher share for eligible, valid ad activity, subject to approval, policy compliance, demand and payment terms.

Google AdSense is the simpler automated option to assess first: Google manages advertiser demand and ad selection. Ghana is listed as an AdSense sign-up country. An eligible adult must own and manage the publisher/payment account and complete required verification.

Google Ad Manager is a more advanced publisher platform for publishers with meaningful direct sales and/or multiple demand sources. Google's sign-up guidance says a valid AdSense account is needed to sign up for Ad Manager. It is a future step to evaluate, not a guarantee of instant brand access or revenue.

### B. Direct Cinema brand partnerships
Cinema creates and sells its own commercial products to brands and agencies:
1. **Cinema Collection Partner** — sponsorship of an editorial collection of relevant stories.
2. **Cinema Premiere Partner** — sponsorship of a licensed premiere or special screening window.
3. **Cinema Story Partner** — sponsorship of a documentary or factual feature, subject to rights-holder approval.
4. **Cinema Channel Partner** — sponsorship of a publisher or studio channel section.
5. **Cinema Home Placement** — a clearly labelled, limited placement on Home or a category destination.

Every sponsorship must be labelled clearly. A sponsor does not gain editorial control or imply filmmaker endorsement unless expressly agreed.

## 3. Cinema's distinctive advertising experience
Cinema should not depend on interrupting a film to earn advertising revenue.

Preferred placements:
- Sponsored collection cards and headers.
- Sponsored premiere pages.
- Clearly labelled partner placements on Home.
- Relevant placements on category and publisher pages.
- Optional contextual sponsor panels on a title information page, where the licence allows it.
- Brand-supported editorial features where rights and editorial terms allow.

Avoid pre-roll, mid-roll and post-roll interruptions as the default; overlays that cover the film; disguising ads as editorial recommendations; excessive ad density; ads on TMDB discovery-only titles that imply Cinema has licensed them; and monetising YouTube-hosted trailers or featurettes through Cinema's own video ad insertion. YouTube-hosted content has separate monetisation rules and should remain an external embed with original publisher attribution.

## 4. Product architecture

### Stage 1 — Frontend placement inventory
Define named placement locations in code:
- `home.collection.sponsor`
- `home.featured.partner`
- `category.header.sponsor`
- `publisher.header.sponsor`
- `title.contextual.partner`

Each placement must render only when an approved campaign is configured; show a visible Sponsored or Partner label; have a responsive size; never block navigation or playback; render nothing when inactive; use an accessible destination link; and record only minimum campaign reporting events.

### Stage 2 — Campaign management
A future Cinema admin workspace should support advertiser/agency identity and adult business contact, campaign name and objective, budget, dates, territory and language, placement selection, creative assets, landing page URL, disclosure, approval status, impression/click reporting, and invoice/payment status managed by an authorised adult/company representative. No advertiser should publish directly without Cinema approval.

### Stage 3 — Programmatic demand
After the site, privacy notices, ad placements and account eligibility are ready, apply for the appropriate Google publisher product, verify the account under an eligible adult/company representative, configure approved placements, test outside production, then launch gradually and monitor policy, user experience and revenue.

AdSense is the simpler automated starting point. Ad Manager becomes relevant when Cinema has enough inventory and direct campaign operations to justify the added complexity.

## 5. How revenue is calculated

For programmatic display advertising, a simplified planning formula is:

`Estimated publisher revenue = eligible impressions / 1,000 × realised publisher eCPM`

The realised eCPM is not guaranteed and varies by geography, advertiser demand, content, season, viewability and policy eligibility.

For direct campaigns, use a fixed campaign fee for a defined period and placement, a negotiated CPM for verified impressions, or a negotiated sponsorship package with agreed reporting. Do not publish fixed rate cards until Cinema has audience and campaign delivery data.

`Net contribution = collected campaign revenue − agreed rights-holder share − payment/serving costs − campaign operating costs − applicable taxes`

A content licence may require a fixed fee, revenue share or another agreed structure. Never assume a rights-holder percentage before negotiation. No audience means no impressions and no programmatic advertising revenue.

## 6. Rights-holder safeguards
Before placing sponsorship around a title, verify Cinema's right to stream the exact title in each territory and period; whether the licence permits advertising, sponsorship, brand association, promotional clips and artwork use; whether the rights holder has sponsor-category or creative approval rights; and any exclusivity, blackout or brand-safety restrictions. A streaming licence does not automatically include title sponsorship rights.

## 7. Privacy, safety and trust
Use contextual placements by default; do not build behavioural advertising profiles of children or teens; collect minimum reporting data; do not expose individual viewing histories to advertisers; provide appropriate privacy notices and consent controls; use age-appropriate ad policies; do not encourage clicks; and keep editorial decisions separate from sponsor influence.

## 8. Launch sequence
1. Confirm authorised content and playback reliability.
2. Define the first 3–5 placement locations and visual standards.
3. Add inactive-by-default placement components; do not show empty ad boxes.
4. Prepare a brand-partnership one-pager and pilot package.
5. Validate privacy, legal, rights-holder and ad-network requirements with an eligible adult/company representative.
6. Apply for a suitable publisher account when the site is ready.
7. Test one limited campaign, measure delivery and user experience, then expand only if it works.
8. Add a campaign dashboard after the operating process and reporting requirements are clear.

## 9. Early success metrics
Track monthly active and returning viewers, eligible page views and viewable impressions, fill rate, realised eCPM, direct campaign revenue and renewal rate, content-rights and delivery costs, title starts and completion rates, ad complaints, accidental clicks and page performance.

## 10. Decisions still required
Which placements are in the first pilot? Which sponsor categories fit the brand and audience? Which licences permit title sponsorship? Which territories and languages are in scope? Which eligible adult/company representative owns publisher-account and financial administration? What audience and privacy readiness are required before launch?

## Official Google references
- AdSense availability: https://support.google.com/adsense/answer/13402307
- AdSense revenue share: https://support.google.com/adsense/answer/180195
- Ad Manager sign-up: https://support.google.com/admanager/answer/7084151
- Ad Manager campaign management: https://support.google.com/admanager/answer/6027116
- IMA SDK: https://developers.google.com/interactive-media-ads
- Ad Manager partner guidelines: https://support.google.com/admanager/answer/9059370
