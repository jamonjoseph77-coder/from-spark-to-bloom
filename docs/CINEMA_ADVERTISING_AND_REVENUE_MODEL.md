# Cinema Advertising Engine And Revenue Model

## Purpose and operating principle
Cinema is a digital entertainment home built around stories. Viewers should be able to discover and watch authorised stories without viewer subscriptions, pay-per-title checkout, intrusive advertising, or mid-roll interruptions.

Cinema owns the advertising experience: its formats, placements, context rules, visual standards, approvals and reporting. Google may provide eligible advertiser demand and ad-serving infrastructure; it does not define Cinema's proprietary products or guarantee a particular brand will appear beside a particular title.

This is a strategy and product specification. It is not evidence of an active Google account, advertiser, campaign, licensing agreement, or revenue.

## 1. The three layers — do not confuse them

1. **Cinema advertising products:** the commercial formats Cinema sells, such as Title Sponsorship, Contextual Brand Partnership, Sponsored Collection and Premiere Partner.
2. **Ad-serving and campaign technology:** Cinema's own placement/campaign layer plus, where appropriate, Google Ad Manager or another approved provider to deliver eligible campaigns.
3. **Advertiser demand:** brands buying through a programmatic auction or brands/agencies buying a direct Cinema partnership.

Google can help with layers 2 and 3. Cinema must design and own layer 1.

## 2. Cinema's advertising products

### A. Title Sponsorship / Title Ads
A brand sponsors the presentation of one specific licensed title or a defined group of related titles.

Possible placements:
- Clearly labelled “Presented with [Brand]” sponsorship on the title's information page.
- A sponsor panel beside the title synopsis, cast or viewing options.
- A sponsor credit on a Cinema-created title page or a dedicated title hub.
- A separately labelled sponsor message on a post-viewing information screen, if the user experience and rights agreement allow it.

The sponsorship must not cover the film, interfere with playback, imply that the filmmaker endorses the brand, or be inserted into the film itself. Any on-screen sponsor credit inside the actual programme requires explicit rights-holder approval and appropriate production/advertising permissions.

### B. Contextual Brand Partnerships
A brand is associated with a title, collection or subject because the campaign is relevant to the content context. Examples include a travel brand supporting a travel documentary collection or an education brand supporting a factual learning collection.

Context is based on the title's approved metadata, category, language and campaign brief — not on building sensitive personal profiles of viewers. The sponsor relationship is labelled clearly and editorial independence is protected.

### C. Sponsored Collections
A brand supports a Cinema-curated collection of stories. Cinema retains editorial control over selection and presentation. The sponsor may approve factual brand assets and agreed category exclusions, not dictate editorial conclusions.

### D. Premiere Partnerships
A brand sponsors a licensed premiere, special screening window or launch event. The package may include a clearly labelled premiere page, event identity, limited Home placement and approved promotional material. The title's licence must permit the activity.

### E. Channel Partnerships
A brand supports a creator, studio, publisher or subject-matter channel for an agreed period. The partnership is clearly labelled and does not give the sponsor ownership of the channel or editorial control.

### F. Cinema Home and Category Partnerships
A limited, clearly labelled partner placement on Home or a category destination. These placements should be visually integrated with Cinema, but never disguised as ordinary editorial recommendations.

### G. Programmatic placements (optional supporting layer)
Standard eligible placements may be filled through an approved network where they fit Cinema's design and policy. These are supplementary inventory, not the identity of Cinema's advertising model. Cinema should not rely on generic banner inventory as its primary commercial proposition.

## 3. What Google can and cannot do

### Google AdSense
AdSense is a simpler way to assess automated demand for eligible standard web placements. Google selects ads according to its systems, policies, auction and available demand. It is not a custom title-sponsorship marketplace and does not promise a chosen advertiser or exact title-to-brand match.

### Google Ad Manager
Ad Manager is a more advanced publisher ad-serving and campaign-management platform. It can support eligible inventory, campaign orders/line items, targeting and reporting. With a properly designed Cinema integration, it may help deliver direct-sold campaigns alongside eligible programmatic demand.

However:
- Google does not automatically create Cinema's Title Ads, Contextual Partnerships or Premiere packages.
- Google does not guarantee that an advertiser will bid on a particular Cinema title or subject.
- Contextual matching to Cinema's title metadata requires Cinema to classify the placement and configure eligible targeting; it must comply with Google's policies and privacy requirements.
- A custom direct sponsorship still needs a brand/agency agreement and Cinema campaign setup.
- Google's standard formats and creative rules still apply to Google-served ads. Cinema cannot disguise or arbitrarily restyle those creatives.

**Recommended direction:** build Cinema's own advertising product and campaign layer first; assess AdSense for suitable standard placements; evaluate Ad Manager when direct campaign operations and inventory justify it. Do not make a Google integration a launch dependency for Cinema's direct sponsorship business.

Ghana's availability on an AdSense sign-up list does not guarantee account approval, advertiser demand, traffic or earnings. An eligible adult/company representative must own and manage publisher, identity, tax and payment administration.

## 4. Cinema Advertising Engine — product architecture

### A. Placement registry
Use stable, named placement identifiers, for example:
- `home.featured.partner`
- `home.collection.sponsor`
- `category.header.partner`
- `title.detail.sponsor`
- `title.contextual.partner`
- `premiere.page.partner`
- `channel.header.partner`
- `post_viewing.partner`

Every placement has a defined location, format, dimensions, supported devices, maximum frequency, disclosure label, allowed campaign types and fallback behaviour. Inactive placements render nothing — no empty ad boxes.

### B. Campaign record
A campaign should define:
- Advertiser and authorised business contact.
- Campaign objective and approved product type.
- Start/end dates, territory, language and age-appropriateness.
- Budget and agreed pricing method.
- Eligible placement IDs and title/category/context allowlists.
- Creative assets, destination URL and disclosure text.
- Rights-holder approvals where required.
- Campaign status, reviewer and approval history.
- Delivery, impression, click and completion reporting where appropriate.
- Invoice and payment status managed by an authorised adult/company representative.

### C. Matching and delivery
Cinema's engine checks campaign status, dates, territory, language, placement, title/category context, rights permissions, age suitability, frequency caps and creative approval. It returns only eligible campaigns. If none qualifies, it shows no ad or a non-commercial Cinema editorial item — never an irrelevant or misleading paid placement.

Programmatic demand is handled only in the inventory and formats approved for the connected provider. Direct sponsorship matching remains controlled by Cinema's campaign rules.

### D. Admin and marketplace
The future Cinema admin workspace should allow authorised staff to review advertisers, approve creative, configure campaigns, set inventory, manage rights approvals, see delivery reports and reconcile invoices. Advertisers should submit enquiries and campaign briefs; they should not publish directly without Cinema approval.

## 5. Revenue channels and pricing logic

### Direct brand partnerships
Potential commercial structures:
- Fixed sponsorship fee for a defined package and period.
- Negotiated cost per thousand verified impressions for suitable inventory.
- A mixed package combining a fixed sponsorship fee with measured delivery.
- Event/premiere sponsorship fee.

Do not publish invented prices or promise reach before Cinema has reliable audience and delivery data. Start with a small pilot package, define exact deliverables, dates, placements, reporting and cancellation terms, and negotiate case by case.

### Programmatic advertising
For eligible display inventory, a simplified planning formula is:

`Estimated publisher revenue = eligible impressions / 1,000 × realised publisher eCPM`

Actual eCPM, fill rate and payment vary by geography, advertiser demand, season, content, viewability, policy eligibility and invalid-traffic controls. No audience or no eligible impressions means no programmatic revenue.

### Net contribution
`Net contribution = collected campaign revenue − rights-holder obligations − ad-serving/payment costs − campaign delivery costs − operating costs − applicable taxes`

A title's presence on Cinema does not itself create revenue. The title must be rights-cleared for the relevant commercial use, the campaign must be sold or valid ad demand must exist, the placement must be delivered and measured, and payment must be collected.

## 6. Rights, trust and safety controls
Before any title-specific sponsorship, confirm the licence covers streaming in the territory and period and separately confirm whether it permits sponsorship, advertising, brand association, use of artwork/stills, promotional clips and sponsor-category exclusivity. A streaming licence does not automatically grant title sponsorship rights.

Additional controls:
- Clearly distinguish paid sponsorship from editorial recommendation.
- Keep sponsor influence separate from editorial decisions.
- Do not share individual viewing histories with advertisers.
- Use contextual targeting rather than behavioural profiles, especially for children and teens.
- Do not target children with inappropriate products or use sensitive personal data.
- Minimise reporting data and provide required privacy notices and consent controls.
- Do not encourage accidental clicks or use deceptive interface patterns.
- Do not place ads over video or interrupt playback.
- Do not monetise YouTube-hosted trailers/featurettes through Cinema's own video ad insertion; retain the official external player and attribution.
- Do not place commercial sponsorship on TMDB discovery-only titles as though Cinema has licensed them.

## 7. Launch plan

### Phase 1 — define and package
1. Confirm the first three products: Title Sponsorship, Contextual Brand Partnership and Sponsored Collection.
2. Select 3–5 placement locations with exact mock-ups and disclosure rules.
3. Create a one-page brand partnership deck and a simple enquiry process.
4. Identify which existing and future title licences permit commercial sponsorship.
5. Keep all placements inactive until a real approved campaign exists.

### Phase 2 — controlled direct pilot
1. Approach a small number of relevant brands/agencies with a clearly scoped pilot.
2. Agree deliverables, rights, dates, reporting, pricing and cancellation terms in writing.
3. Have the authorised adult/company representative handle all contracts, invoices, tax and payments.
4. Run one campaign, verify placement behaviour and report delivery honestly.
5. Review viewer experience and campaign outcomes before expanding.

### Phase 3 — programmatic assessment
1. Confirm website quality, content rights, privacy disclosures, policy readiness and account eligibility.
2. Apply for a suitable publisher product through the eligible adult/company representative.
3. Test standard placements separately from Cinema's direct sponsorship formats.
4. Monitor fill, viewability, invalid traffic, user experience and actual net revenue.
5. Evaluate Ad Manager only when the operational need and inventory justify it.

## 8. Metrics
Track:
- Monthly active and returning viewers.
- Eligible title and page views.
- Campaign-qualified inventory and sell-through.
- Direct campaign revenue, collected revenue and renewal rate.
- Programmatic fill rate, viewability and realised eCPM.
- Campaign delivery against agreed commitments.
- Rights-holder costs and net contribution.
- Title starts/completions and page performance.
- Complaints, accidental clicks and sponsor-category conflicts.

## 9. Decisions to validate before launch
- Which three advertising products form the first commercial pilot?
- Which title licences explicitly allow title sponsorship and contextual advertising?
- Which sponsor categories fit Cinema's audience and editorial standards?
- Which territories and languages can the first campaigns cover?
- What minimum audience and reporting readiness should be required?
- Which adult/company representative is authorised to manage contracts, publisher accounts, tax and payments?

## Official Google references
- AdSense availability: https://support.google.com/adsense/answer/13402307
- AdSense revenue share: https://support.google.com/adsense/answer/180195
- Ad Manager sign-up: https://support.google.com/admanager/answer/7084151
- Ad Manager campaign management: https://support.google.com/admanager/answer/6027116
- IMA SDK: https://developers.google.com/interactive-media-ads
- Ad Manager partner guidelines: https://support.google.com/admanager/answer/9059370
