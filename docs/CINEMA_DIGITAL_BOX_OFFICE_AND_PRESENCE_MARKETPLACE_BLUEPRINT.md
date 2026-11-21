# Cinema Digital Box Office & Presence Marketplace Blueprint

**Cinema — Experience the World of Stories**

_Status: internal operating blueprint. This is not a live marketplace, signed commercial offer, contract, payment instruction or claim of revenue._

## 1. The business principle

Cinema should make stories accessible to viewers while creating measurable commercial value for rights holders, creators and carefully selected brand partners.

The product is not a subscription service and should not depend on intrusive advertising or mid-roll interruptions. Viewers should be able to discover and watch authorised stories without a viewer subscription or pay-per-title checkout in the current model.

Cinema earns through business-to-business partnerships around content, programming and audience experiences. Every commercial use must be allowed by the relevant content rights and agreed in writing.

## 2. Revenue streams to build

### A. Digital Box Office — title-centred commercial partnerships

A title, series, premiere, special episode or live programme can have its own commercial record and partner package.

Possible packages:
- **Title Presentation Partner:** a brand supports the presentation of one eligible title or premiere, with a clearly disclosed credit.
- **Sponsored Premiere / Event:** a brand funds a time-limited launch experience or viewing event.
- **Brand-Funded Access:** a partner underwrites a free-to-view window for an eligible title, subject to rights-holder approval.
- **Title Collection Partner:** a brand supports a curated collection around a theme, season or cultural moment.

The viewer does not pay. Do not promise a title can be sponsored until its licence expressly permits sponsorship, advertising and the proposed promotional materials.

### B. Cinema Presence Marketplace

A business-to-business place for verified organisations and approved commercial opportunities.

**Supply side**
- Verified studios, producers, distributors and broadcasters.
- Creators with approved profiles and content.
- Rights holders offering titles or catalogues for licensing.

**Demand side**
- Brands and agencies looking for story-led campaigns.
- Event and programme partners.
- Organisations interested in supporting a themed collection or premiere.

**Marketplace objects**
- Verified organisation profile.
- Content/property listing with rights window and territories.
- Brand brief or campaign opportunity.
- Proposal and deliverables.
- Approval record and signed agreement reference.
- Campaign delivery report.
- Revenue and settlement record.

A profile or listing is not an endorsement, rights grant or promise of audience reach. Paid placement must be labelled clearly.

### C. Sponsored collections and programming

Brands can support a curated collection, seasonal destination, documentary strand, cultural programme or creator showcase. Cinema should sell a defined package of approved placements and reporting, not access to personal viewer data.

### D. Creator and studio campaigns

A brand may commission or sponsor an approved creator programme, interview, short-form series or behind-the-scenes feature. The creator, rights holder and Cinema must agree the content, usage rights, disclosure and deliverables before production or publication.

### E. Future licensing and distribution services

Once Cinema has content it owns or is authorised to distribute, it may explore licensing that content to other platforms or broadcasters. This is a later-stage revenue stream, not a current capability or guaranteed income.

## 3. Revenue accounting — one source of truth

Every commercial opportunity should have a unique campaign or title identifier and a written record of:
- Contracted gross amount and currency.
- Contracting parties and authorised signatories.
- Deliverables, due dates and proof of delivery.
- Applicable taxes, payment fees and approved direct costs.
- Rights-holder, creator or production partner allocation.
- Refunds, credits or make-goods, if any.
- Amount invoiced, amount received, amount payable and payment status.
- Cinema's retained amount and the calculation used.

Use the actual signed deal terms. Do not invent a standard revenue-share percentage or promise a minimum guarantee before the economics and funding are approved.

**Illustrative calculation only:**

`Cash received`
minus `taxes and transaction costs`
minus `approved campaign delivery costs`
minus `contracted rights-holder / creator allocations`
equals `Cinema contribution before general overhead`.

Do not count a proposal, verbal promise, invoice not yet paid or projected campaign value as revenue received. Never sell identifiable viewer data.

## 4. The end-to-end operating workflow

1. **Discover:** a studio, creator, distributor or brand is identified.
2. **Verify:** confirm the organisation, representative and authority. Verification is not a content licence.
3. **Submit:** the rights holder provides the content package, rights scope, territories, dates, platforms and evidence.
4. **Review:** Cinema checks rights, classification, technical delivery, suitability and promotional permissions separately.
5. **Commercial proposal:** where a title is eligible, prepare a specific partner package with deliverables, placement, reporting and cost assumptions.
6. **Adult-authorised agreement:** an appropriately authorised adult representative reviews and signs any contract, licence or payment arrangement.
7. **Deliver:** receive the approved master and campaign assets; test playback and placements.
8. **Publish:** an authorised Cinema reviewer records the publication approval and rights window.
9. **Measure:** report only metrics Cinema actually captures, with definitions and limitations.
10. **Settle:** reconcile cash received, direct costs and contractual allocations; record payment completion.
11. **Close or renew:** remove expired placements, close rights windows and renew only with fresh approval.

A title must never go live just because a sponsor is ready to pay.

## 5. What exists today versus what still needs building

**Repository state reviewed 21 November 2026.** The Cinema viewer and Cinema Presence Marketplace are separate applications and separate data/security boundaries. The Marketplace repository now contains substantially more operational code than the earlier blueprint snapshot. Code in GitHub is not proof that production hosting, Firebase rules, server secrets, provider accounts or live transactions are configured.

| Capability | Current code position | Still required before calling it live |
|---|---|---|
| Studios & Publishers directory | Viewer has publisher discovery/profile routes and publisher channel content. | Verify production catalogue quality, profile ownership and territory-specific rights. |
| Studio application and title submission | Viewer has organisation/studio applications, title submission and rights declarations/review flows. | Confirm every title's evidence, publication decision, technical delivery and licence scope. |
| Marketplace organisation onboarding | Marketplace has organisation applications, admin review, memberships and role-scoped workspaces. | Verify production Firebase rules and hosting; confirm authorised organisation members can complete the journey. |
| Presence relationship intake | Marketplace supports brand, studio/rights, publisher distribution, creator collaboration, partner-cinema programming, production, event and licensing briefs with separate deliverables from ad placements. | Complete dedicated agreements, milestones, notifications and fulfilment workflows for each relationship type. |
| Rights and inventory | Marketplace has rights-evidence submissions, admin verification and rights-backed inventory approval. | Independently verify the evidence and actual rights for every title, territory, term and format. TMDB metadata is not a licence. |
| Commercial offers | Marketplace has Cinema-admin proposal creation and organisation response workflows. | Add and verify executed agreement capture, authorised signatories and immutable contract history. An accepted proposal is not a signed contract. |
| Cinema Presence viewer placements | Viewer has 13 contextual Presence placement mounts and a consent/measurement boundary. Marketplace has server-side eligibility, signed event and reporting code. | Verify every placement against the viewer integration, rights, territory, consent, schedule, delivery capacity and reconciliation. |
| Advertising demand | Marketplace has fail-closed Adsterra assessment and GAM connection/readiness checks. Meta Audience Network and Pixel are not established as working web demand integrations. | Provider/domain approval, format validation, adult-authorised account, privacy review, creative/territory approval and verified delivery. Advertising remains optional. |
| Digital Box Office and Paystack | Marketplace has order, webhook verification, funding ledger, delivery review, settlement reconciliation, 70/30 net-pool calculation and payout-request code behind readiness gates. | Reconcile the open fixed-price activation work without regressing approved CPM/CPC exceptions; verify test-mode payment-to-delivery-to-settlement and adult/legal account ownership. No live collection or payout has been proven here. |
| Reporting | Marketplace has event and financial reporting code. | Verify actual viewer events, attribution, completeness, retention and reconciliation before presenting any figures as commercial results. |

Do not describe a Coming Soon page as a working marketplace. Do not create sample deals that look real or display fake revenue, sponsor logos, audience numbers or partner commitments. Distinguish **implemented in code**, **configured**, **tested end-to-end**, and **live/verified** in every status report.

## 6. Safe, low-cost implementation sequence

### Phase 1 — operational foundation
- Keep the viewer and Marketplace as separate applications with separate permissions and data stores.
- Continue building the broader Presence network: verified organisations, publisher channels, studio/rights participation, creator-business proposals, partner-cinema relationships and event/production partnerships.
- Keep ad placements as one optional Presence product family, not the definition of the platform.
- Maintain title, territory, term, creative, audience-suitability and placement approvals as independent gates.
- Do not make production schema, RLS, secrets, financial-account or deployment changes without the required explicit authorisation and adult/legal review.

### Phase 2 — controlled pilot
- Select one to three fully authorised titles and verify playback and territory restrictions.
- Confirm the relevant rights holder permits the exact commercial use and promotional materials.
- Agree a specific sponsorship or non-ad partnership package in writing through appropriately authorised adult representatives.
- Test viewer placement delivery, measurement, reporting, payment reconciliation and settlement using non-production/test configuration.
- Review actual economics and delivery evidence before repeating the pilot.

### Phase 3 — complete Presence operations
- Complete public organisation discovery using only explicitly approved profile fields; never expose private briefs, contacts, rights evidence or financial records.
- Complete agreement signing/recording, relationship-specific deliverables, milestones, notifications, expiry and dispute workflows.
- Complete partner-cinema distribution and settlement, creator commissioning, publisher distribution contracts and production/event agreements.
- Complete reservation expiry/release, delivery-cap enforcement, reporting reconciliation and finance audit trails.
- Complete provider integrations only where format, privacy, account authority and viewer experience are proven.

These are remaining implementation and verification tasks, not claims that the entire marketplace is already operational.

## 7. Launch gates — do not skip

- [ ] Cinema has a legally reviewed operating and licensing position for each launch territory.
- [ ] Every published title has documented rights for the exact use, territory, platform and time window.
- [ ] Sponsor/advertising permissions are explicit for the specific title and placement.
- [ ] Brand claims and campaign assets have been reviewed.
- [ ] Any required classification and regulatory approvals are complete.
- [ ] Playback and campaign placements work on supported devices.
- [ ] Reporting metrics are measurable and accurately defined.
- [ ] Commercial terms, taxes, payment responsibilities and allocations are reviewed by qualified adults.
- [ ] Agreements are signed by authorised representatives.
- [ ] Revenue is recorded only when supported by the accounting evidence.

## 8. Guardrails

- No viewer subscriptions or pay-per-title checkout in the current model.
- No intrusive mid-roll advertising.
- No sponsor integration that conflicts with the content licence or creator approval.
- No sale of personal viewer data.
- No fake partner logos, invented metrics, guaranteed audience numbers or unearned revenue claims.
- No payment collection, contract signing or rights commitments by a minor. A parent/guardian and qualified adult advisers must supervise external commercial activity.
- No production database, schema, RLS or data changes as part of this blueprint.
- No publishing unlicensed content to meet the 40–100 title target.

## 9. What success looks like

Cinema's first commercial proof should be a small, fully authorised pilot where:
- viewers can watch the complete title successfully;
- the rights holder knows exactly where and how the title is available;
- a brand receives the agreed, clearly disclosed deliverables;
- Cinema measures and reports real performance;
- all costs and contractual allocations are reconciled; and
- Cinema can show whether the activity generated a positive contribution.

That is the foundation for a repeatable Digital Box Office and a real Presence Marketplace—not merely a page displaying logos.
