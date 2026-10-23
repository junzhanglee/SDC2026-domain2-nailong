# Product Design: Nexus

Research/proposal date: 23 October 2026, Malaysia time. This is a competition proposal and prototype; described functionality does not imply production integrations.

## Focus

**Turn customer messages into accountable, approved and traceable fulfilment work.**

The initial use case is a small print/custom-gift business receiving an urgent request without checking stock, delivery expectations and staff leave together. This leads to repeated owner follow-up or premature commitments. A single order can demonstrate the full journey using people/project context. New value comes from customer service, stock checks and fulfilment coordination rather than copying HR features. A 5–20-person initial customer segment is an unvalidated hypothesis, not an official SME classification.

## Source Notes

The user's note colours represented sections/themes (blue), required actions (red), emphasis (green) and pain points (purple). The main notes called for Trigger → Connected data → Decision logic → Human approval → Visible outcome and permitted simulated identity, RBAC and platform APIs. People, Work and Connect remain simulated context; the competition story centres on the new fulfilment workflow.

The theme notes highlighted affordability, disconnected tools and training barriers, proposing configurable workflows with fixed execution rules and human approval. The prototype uses a static website, spreadsheet entry and a small set of clear actions. Industry configuration should guide adaptation; a model must not improvise permissions or payments. Unlinked WhatsApp/payment usage statistics from the notes were not repeated as verified market facts.

## Malaysian SME Context

The referenced DOSM 2024 MSME report records 39.5% GDP contribution and 5.8% output growth. These are dated background statistics, not 2026 latest figures or product-effect evidence.

Working assumptions requiring validation:

- Small teams combine customer support, quotations and scheduling; support combined permissions without requiring a dedicated administrator.
- Messages/spreadsheets are established inputs. Migration and training may cost more than licences; begin with one existing event.
- Orders, payments, stock and people are fragmented. Reliable context and handoff matter more than additional generic chat.
- Language/digital confidence varies. The current interface remains Chinese with familiar English module labels and mobile layouts. English repository documents do not establish multilingual UI; Bahasa Melayu/English localisation and usability tests remain future work.
- Production scheduling needs state-specific calendars, RM currency and Asia/Kuala_Lumpur time. Demo leave allowances, claim thresholds and overtime prompts are sample policies.

Do not equate small size with weak management or assume every Malaysian business uses the same tools.

## Core Journey

1. Trigger: an enquiry requests 100 customised cups by 26 October 2026.
2. Context: stock is 80; Daniel has approved leave on delivery day; Amir has relevant skills and capacity.
3. Decision: fixed rules identify a shortage of 20 and suggest an available employee.
4. Approval: Customer Service prepares; a manager/owner approves. Recheck before execution and reject repeat approvals.
5. Outcome: create an assigned customer-linked task blocked pending replenishment. Do not purchase, pay, issue a quotation or promise delivery automatically. Record approvals/exceptions.

Messages without quantity/date enter the support queue; staff confirm fields instead of guessing. Replies are editable drafts; real sending requires a separate authorised channel.

## Supporting Modules

People demonstrates leave/balances/approval, overlap and task conflicts; claims with image preview/manual entry/threshold review; overtime requests/hours/prompts; attendance, public directory, announcements and HR CSV analysis. Receipt OCR is not connected.

Work records accomplishments, next actions and blockers, project priorities, synthetic baselines and customer-linked tasks. Approved leave informs staffing. Records and risks offer clues to delays, not proven causality.

Connect contains proposed internal contracts/sample events for payments, accounting, payroll, CRM, ecommerce and WhatsApp; providers remain to be verified. Internal chat is local, with authorised-channel rule summaries; customer messages remain in a separate inbox. A future WhatsApp integration uses an authorised business API, never private-account scraping or WhatsApp Web embedding.

Activity and insights show/export requests, simulated events, approvals and validation errors. Role-scoped monthly rule reviews use Malaysian dates. Tamper-resistant auditing requires a backend.

## Implementation and Commercialisation

Hackathon: demonstrate one explainable journey, role switching, blocked approvals and exceptions.

Pilot: interview five target businesses, collect anonymised order-handling time, omissions/rework, suggestion edits and first-time task success. Compare equivalent orders before/after and record sample sizes. A 30% preparation-time reduction and 50% omission reduction are **unverified targets**, not achieved results.

Integration: agree backend/auth contracts, connect authorised business WhatsApp plus one stock/order source, then evaluate optional model assistance with confidence, source references and human confirmation.

Expansion: configure fields, thresholds, skills and adapters for repair, gifts and appointments. Perishable food stock requires separate validation; cup-count rules do not transfer unchanged.

Business model hypothesis: monthly company subscription with member/workflow allowances, plus advanced connectors/usage. Prices and willingness to pay are unvalidated. Explain channel/model costs and distribute reusable templates through partners.

## SDG Evidence

- 8.2: handling minutes per order and completed work per person/week.
- 8.3: affordability, need for specialist IT, retention and willingness to pay.
- 10: mobile and low-digital-confidence task success without sensitive-data employee scoring.
- 12: duplicate purchases, urgent replenishment and rework materials. Do not claim environmental savings before measurement.

## Risks and Fallbacks

Supplier access/backend readiness may block integration. Use clearly labelled adapters and synthetic events; the core demo must not depend on live Orbyte access. Models may extract incorrectly, follow injected messages or leak context. Confirm fields manually and keep fixed rules/approval in control. An overbroad feature tour obscures innovation: pitch one order and use supporting modules as context. Before real records or transactions, implement server-side authorisation, tenant isolation and persistent tamper-resistant events.

## References

- [Original competition notes](https://app.notion.com/p/40083c8a3210809fb2d9dd7303019085), recorded as read 23 October 2026.
- [Theme notes](https://app.notion.com/p/40083c8a321080f382d1cdd87e9fe389), recorded as read 23 October 2026.
- [DOSM MSMEs Performance 2024](https://www.dosm.gov.my/portal-main/release-content/micro-small--medium-enterprises-msmes-performance-2024), dated market background.
- [Malaysian government calendar](https://www.malaysia.gov.my/calendar), previously referenced for the 8 November 2026 Deepavali example; verify state applicability/substitute holidays before production scheduling.
- [Meta WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/overview), proposed integration reference; the earlier lookup was rate-limited and current requirements remain to be checked.
