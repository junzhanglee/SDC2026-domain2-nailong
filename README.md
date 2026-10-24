# Nexus — From Customer Messages to Fulfilment

> **2026-10-24 AI update:** The deployed architecture now includes a server-side OpenAI Responses API adapter (gpt-4.1-mini), selected-message extraction and editable reply drafts. ChatGPT sign-in is required for AI calls. Cloudflare D1 stores daily usage counters only; business records still use browser localStorage. Live API verification reached OpenAI but returned `credit_balance_exhausted`; successful generation requires the project owner to add API credits. See [AI integration](docs/ai-integration.md). Older submission drafts describe the previous static version and must be reviewed before submission.

Nexus helps Malaysian micro and small businesses turn customer enquiries into context-checked, human-approved fulfilment tasks.

## SDC 2026 — Team Information

- Team: **nailong**.
- Assigned domain: **Domain 2 — Orbyte Smart SME Challenge**.
- Main SDG: **8 — Decent Work and Economic Growth**, targets **8.2 / 8.3**.
- Project: **Nexus**.
- Team leader: **LING YUXUAN**.
- University: **Xiamen University Malaysia**.
- Team size: **4 members (leader + 3 team members)**.
- Responsibilities: **concept development / frontend debugging / backend debugging**. Individual assignments for the three team members have not been supplied; LING YUXUAN serves separately as team leader. Backend debugging is a team responsibility, not a claim that a production backend is implemented.
- Mandatory training: **all members completed the GenAI, Database and Cloud Deployment workshops**, as confirmed by the team.

## Links

- [GitHub repository](https://github.com/junzhanglee/SDC2026-domain2-nailong). Application source is on **`feat/nexus-mvp`**; `main` currently contains the initial repository files. The final submission must expose the application source on its submitted branch.
- [Replit project](https://replit.com/t/nai-long/repls/SDC2026-domain2-nailong-2). This is an editor/project link for proof of use, not the public judging website.
- [Existing live demo](https://nexus-nailong-2026.d7ystszcjf.chatgpt.site/). Browser-local synthetic data; use a fresh session for a clean demo. Final submission-version verification is pending.
- Published Replit website: **not yet supplied or verified**. Recent screenshots show publishing settings prepared, not publication completed.
- Slide deck / YouTube pitch video: **pending**.
- RunPod endpoint: **not applicable to the current implementation — the team confirms RunPod was not used**.
- [Submission drafts and completion checklist](submission/README.md).

## Overview

### Problem

A small print or custom-gift business may receive an urgent customer request through chat while stock, staff availability and task ownership remain in separate records. A premature delivery promise or unclear handoff can lead to repeated follow-up and missed work. Our initial user and industry assumptions still require SME validation.

### Solution and Key Features

Nexus checks stock and approved leave, prepares an assignment, routes it to an authorised human and creates a linked task with an activity record. The core demo uses deterministic rules. **The application currently makes no LLM or other AI-model calls.** Future AI-assisted extraction would propose fields for human confirmation; code retains control over permissions and consequential actions.

- One customer request flows through data checks, a decision, approval and a visible outcome.
- Approval rechecks business data and rejects duplicate execution; insufficient stock creates a blocked task rather than a delivery promise.
- Simulated roles demonstrate who may prepare or approve work; customer summaries exclude internal decision details.
- The concept fits Orbyte as a reusable business workflow. People, Work and Connect provide simulated context; existing HR features are not the innovation claim.

### Tech Stack and Architecture

- Frontend: HTML, CSS and native JavaScript ES modules; no third-party JavaScript runtime dependencies.
- Business logic: browser-side rules and approval state transitions.
- Storage: localStorage containing synthetic demo records; no production database or server-side authentication.
- Local/Replit serving: Python 3 static HTTP server. Node.js 22+ runs tests and build checks.
- Hosting: existing Sites demo; Replit project used for import/run setup as reported by the team. No public Replit deployment has been verified here.
- AI/GPU: no runtime AI model or GPU workload in this codebase. Development assistance is declared separately.

```text
Customer request → confirmed fields → synthetic stock / staff / leave
                → deterministic rules → authorised human approval
                → linked task + browser-local activity record
```

For the current and proposed production architecture, see [architecture](docs/architecture.md), [integration boundaries](docs/integrations.md) and [product design](docs/product-design.md).

## How to Run on Replit

Open the Replit project above, or import the GitHub repository and select **`feat/nexus-mvp`**. Confirm that `apps/web/index.html` is present. Start in Shell or configure Run with:

```sh
python3 -m http.server 3000 --bind 0.0.0.0 --directory apps/web
```

Open Preview. No API keys, database setup or package installation are required for this static prototype. For static publishing, use `npm run build` and the output directory `dist/`. A prepared configuration does not establish that a public website is published; verify the final public URL separately. Keep any newer Replit workspace configuration when syncing this documentation.

## How We Use Replit

The team imported the existing repository, switched to the application branch and reported successful preview. Supplied Replit screenshots show static publishing settings and platform-reported checks; these do not prove publication. Collect the team/project identity, actual run evidence and accessible project link using the [proof-of-use draft](submission/SDC2026_nailong_Replit_POU.draft.md). The final proof PDF is pending.

## How We Use RunPod

The team confirms that RunPod was not used. No RunPod call, endpoint or GPU workload is implemented in the current source. The official sample labels RunPod as required, while the Participant Handbook ties mandatory RunPod use to GPU work. **Resolve applicability with the organisers before finalising the declaration; do not claim use without evidence.** See the [submission checklist](submission/README.md).

## Challenges & Learnings

Approval must recheck stock and availability rather than trust a stale recommendation. Role-based UI filtering can demonstrate a workflow, but browser-local data cannot provide a production security boundary. A narrow order-to-task journey communicates business value more clearly than a tour of all administrative modules.

## Future Improvements

- Validate order-handling time, missed checks and learnability with target SME users.
- Add server-side identity, tenant isolation, transactional approvals and persistent events before handling real records.
- Connect one authorised business messaging source and one stock/order source.
- Evaluate optional model-assisted field extraction with source references, missing-field handling and human confirmation.

## Team and AI-Assisted Development

The team has four members: the leader and three team members covering concept development, frontend debugging and backend debugging. LING YUXUAN is the team leader; other member names and individual role assignments have not been supplied. Codex/ChatGPT assistance was used for project code and documentation; the full tool/model inventory and extent of use must be checked by all team members. Current rules are tested automatically, but testing is not a substitute for the team's review and responsibility. Do not list the development assistant as an AI model embedded in the product.

## Submission Checklist

- [x] Application source, architecture notes, synthetic demo data and Apache-2.0 LICENSE are present locally.
- [x] Local verification on 2026-10-23: 43 existing business tests and build checks passed.
- [x] Team name, leader, university, size, responsibility areas and completion of all three mandatory workshops confirmed by the team.
- [ ] Add the remaining member names and individual role assignments.
- [ ] Finalise the official preliminary proposal and technical declaration PDFs, including signatures.
- [ ] Attach the Replit proof PDF; resolve RunPod applicability and attach evidence if applicable.
- [ ] Add slide deck and 5–7 minute YouTube pitch links.
- [ ] Verify the submitted repository branch, visibility and every judging link.
- [ ] Submit through the official portal and keep the receipt.

This repository was adapted to the [official submission template](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template), rather than replacing the application with its example Python/GPU code. Pending fields and `.draft.md` files are not completed submission PDFs.

## License

Apache License 2.0; see [LICENSE](LICENSE). Preserve third-party attribution where applicable.

## Demonstration Guide (approximately 3 minutes)

1. Enter as Customer Service and prepare the Bunga Café request for 100 customised cups.
2. Check the stock shortage and approved leave; inspect the proposed assignee. Customer Service cannot approve the business decision.
3. Switch to the designated manager and approve. Recheck the state, create exactly one blocked task and avoid promising delivery before replenishment.
4. Inspect Work and the activity record. Confirm an ordinary employee sees only their own scoped records.
5. Use the customer entry to demonstrate customer-to-support messaging and request summaries without exposing internal decision details.

This is the product-demonstration segment, not a substitute for the required 5–7 minute pitch video.

## Additional Implemented Features and Limits

People includes synthetic leave, claims, overtime, attendance, directory and announcements. Work includes daily records, project tasks and handoffs. Connect contains proposed contracts and sample events rather than live supplier integrations. Receipts support preview and manual entry; OCR is not connected.

Internal channels and direct conversations demonstrate participant-based filtering. Owner status does not grant access to others' direct conversations. Ordinary chats do not trigger public-screen banners. Only the owner can issue a public-screen notification through the dedicated form; managers cannot publish those notifications. Read status and same-origin tab updates are simulated locally, without cross-device synchronisation.

The profile menu supports personal details, avatar, export and sign-out. Settings include personal preferences and management-only company/approval settings. Customer entry uses fixed synthetic identities; only Customer Service creates customer requests, and approval precedes task creation. These browser checks are not production authentication or data isolation.

The interface uses translucent materials, a neutral palette and responsive layouts. English submission documentation does not imply that the currently Chinese-language interface is fully localised.

## Project Structure

```text
apps/web/             Browser application, interface, rules and synthetic data
contracts/            Proposed internal API contracts, not deployed endpoints
docs/                 Product, architecture, integration and feature notes
submission/           Submission drafts and completion instructions
submission/private/   Local-only contact details and personalised drafts (Git-ignored)
tests/                Existing business and access-scope tests
scripts/              Static checks and build tools
.github/workflows/    Repository check workflow
```

## Local Development

No dependency installation is required. Serve the application using Python 3:

```sh
python3 -m http.server 4173 --directory apps/web
```

Open http://localhost:4173. With Node.js 22+ available, run:

```sh
npm test
npm run build
```

The build checks modules, static assets and proposed API contracts before copying the site into dist. Do not open the site through a file URL. Never commit secrets or real customer/employee records. Preserve the Apache-2.0 licence and unrelated code. See the existing feature and architecture notes in docs for implementation details.
