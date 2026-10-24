# Nexus - From Customer Messages to Fulfilment

Nexus helps Malaysian micro and small businesses turn customer enquiries into context-checked, human-approved tasks. The core journey is **message -> confirmed fields -> stock/staff checks -> human approval -> assigned task -> activity record**.

## Team

- Registered team: **奶龙 (nailong)**; Domain 2.
- Main SDG: **8 - Decent Work and Economic Growth**, targets **8.2 / 8.3**.
- University: **Xiamen University Malaysia**.
- Leader: **LING YUXUAN**.
- Members: **LI JUNZHANG, XIE WEIYE, HU ZHAOMING**.
- All four members completed the mandatory GenAI, Database and Cloud Deployment workshops, as confirmed by the team.
- No unconfirmed individual duties or GitHub accounts are assigned here. The official proposal/declaration PDFs do not require per-member duties.

## Judge-facing Links

- [Live Nexus prototype](https://nexus-nailong-2026.d7ystszcjf.chatgpt.site/).
- [Application source branch](https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp).
- [Preliminary proposal - revised review copy](submission/SDC2026_nailong_Preliminary.pdf).
- [Technical declaration - revised review copy](submission/SDC2026_nailong_TechDeclaration.pdf).
- [Submission status and remaining evidence](submission/README.md).
- [Replit project](https://replit.com/t/nai-long/repls/SDC2026-domain2-nailong-2): team-confirmed development/testing with SDC premium access; this editor link is not a public deployment URL.
- [English pitch deck (.pptx)](submission/pitch-deck/SDC2026_nailong_Nexus_Pitch.pptx): 12 core slides and 2 appendices, with [English speaker notes](submission/pitch-deck/Nexus_English_Speaker_Notes.md).
- [Pitch and prototype demonstration video](https://youtu.be/n85MLCLX3D8): team-supplied link. Player duration checked on 24 October 2026: **7:28**, exceeding the official 5–7-minute limit; trim before final submission and recheck judge access.

The revised PDF copies retain the team-supplied leader email and phone as requested by the team for the official submission. This repository is public. No signature is applied by the assistant; the leader must review and sign the official copies. Local working revisions and authoring files remain Git-ignored under `submission/private/`. No screenshot or sponsor usage evidence is fabricated.

## Implemented Features and Current Limits

- Customer/support interfaces, explicit handoffs and linked tasks. Fixed rules check sample stock, skills and approved leave; approval rechecks current state and prevents duplicate execution.
- Local `.xlsx` / `.csv` employee-resource analysis for owners, managers and HR. Files are processed in the browser without being uploaded; fflate 0.8.3 provides ZIP decompression.
- A server-side **OpenAI Responses API** adapter (`gpt-4.1-mini`) extracts selected-message requirements and returns editable reply drafts. API keys stay in server secrets; ChatGPT sign-in and daily D1 quotas protect calls. **The last live verification returned `credit_balance_exhausted`; no successful model generation is claimed.**
- Browser-local role filtering, approvals, People/Work modules, private/shared chat, personal settings and owner-only public notices are interaction demonstrations, not production enterprise security.
- Business/customer records remain in localStorage; there is no cross-device sync or production tenant isolation. D1 stores AI usage counters only.
- WhatsApp, Microsoft 365 cloud workbooks, payments, accounting, payroll, CRM and commerce remain unconnected. Receipts use image preview/manual entry; OCR is not connected. Other summaries remain deterministic.

## Architecture

```text
Browser UI -> local rules -> human approval -> tasks / localStorage
    |
    +-> explicitly selected message -> Sites Worker
          -> ChatGPT identity + D1 usage limit
          -> OpenAI Responses API -> validated draft -> human review

Local Excel/CSV -> browser parser -> field validation -> resource summary
```

OpenAI Sites deploys an ESM Cloudflare Worker with embedded frontend assets and backend endpoints. Cloudflare D1 is provisioned through the hosting manifest for usage counters. The key is configured as a hosted secret. Browser-selected demo roles do not establish real company membership. See [architecture](docs/architecture.md), [AI integration](docs/ai-integration.md), [Excel/WhatsApp status](docs/excel-and-whatsapp.md) and [privacy/limits in the declaration](submission/SDC2026_nailong_TechDeclaration.draft.md).

## Local Development and Verification

Use **Node.js 24+**. No package installation is required; the licensed fflate browser module is vendored.

```sh
npm test
npm run build
npm run dev
```

Open `http://127.0.0.1:4173`. `build` validates the modules/contracts and creates `dist/server/index.js` plus hosting metadata. `dev` uses that built Worker, a loopback-only local preview identity and an in-memory SQLite quota table. Rebuild and restart the preview after source changes. `.env.local` is optional for non-AI preview; a configured `OPENAI_API_KEY` with usable API credits is needed for real model calls. Never commit it or enter sensitive real records.

The latest verified run on 24 October 2026 passed **61 automated tests**, with browser checks for representative workflow, AI error feedback and actual Excel file import. The GitHub Actions workflow runs tests/builds; do not substitute configured CI for a verified specific run.

A Python static HTTP server can still display the frontend alone, but it does not run the backend endpoints. The current `dist/` is **Worker output, not a static publish directory**. Do not publish it through Replit static hosting settings.

## Replit and Sponsor Resources

The team confirms SDC supplied Replit premium account access, used for importing/running the project and development/testing. Earlier Replit preparation used static serving. The present Sites Worker has not been verified as running or deployed on Replit. A current Replit deployment would need a compatible server adapter and new verification; no automatic deployment parity is claimed.

The [Replit evidence preparation PDF](submission/SDC2026_nailong_Replit_POU.pdf) and [evidence checklist](submission/SDC2026_nailong_Replit_POU.draft.md) identify the missing account/project and running-preview screenshots. They are not completed usage proof. The official template marks RunPod proof as required; the team did not use RunPod and must obtain the organisers' applicability decision rather than fabricate evidence or assume an exemption.

## RunPod Usage Declaration — Not Used

The Nexus team did not use RunPod in this project. No RunPod API, GPU instance, serverless endpoint or sponsor credits were used. There is no RunPod endpoint or proof of use to submit. The current prototype is hosted through OpenAI Sites and its AI integration uses the OpenAI Responses API; RunPod is not part of the architecture. This is a declaration of non-use, not a claim that the organisers have waived any requirement.

## SDG Evaluation Plan

The initial manual-handling baseline is a transparent **10-minute team estimate** (3 minutes structure, 4 check, 3 assign/record), not an observed industry benchmark. Phase 2 will measure a manual baseline with target users, then compare matched tasks. Targets: **30% lower median active handling time** and **100% human approval coverage** for critical actions. Track missing required information, failures and sample size. Do not claim achieved cost savings, omission reduction or environmental benefits before measurement. SDG definitions: [UN Goal 8](https://sdgs.un.org/goals/goal8).

## Demonstration Guide

1. Enter Customer Service, confirm a sample enquiry and run stock/staff checks.
2. Observe a stock shortage or approved leave and the proposed assignment.
3. Switch to the designated manager and approve; inspect the linked task and activity record.
4. Confirm employee-scoped display and owner-only broadcast behaviour.
5. Import an Excel/CSV resource table. For AI, inspect the consent/selected-message boundary and current provider-credit error without claiming a generated result.

## Repository Structure

```text
apps/web/              UI, browser rules and synthetic records
worker/                Hosted server-side AI and asset handling
contracts/             Proposed supplier contracts (not live vendor APIs)
drizzle/               D1 usage-counter migration
scripts/               Validation, Worker build and loopback preview
submission/            Public review PDFs, editable sources and readiness status
submission/private/    Git-ignored contacts, private revisions and authoring files
THIRD_PARTY_LICENSES/   fflate attribution and MIT text
docs/                  Architecture, design and integration boundaries
tests/                 Business, AI-boundary and import validation tests
.github/workflows/     Test/build workflow
```

## Development Assistance and Responsibility

ChatGPT and Codex assisted planning, code, debugging, tests, deployment and documents, with major use disclosed in the declaration. Model/product versions not recorded are not invented. The team must verify any additional member tools, including any Replit Agent use, before final attestation. No assistant-generated signature is applied.

## Submission Readiness

- [x] Application, synthetic records, tests and third-party licence notices are present.
- [x] Public review PDFs and updated editable sources are in `submission/`.
- [x] Current architecture, Replit sponsor use, actual members and API limitations are consistent in the revised materials.
- [ ] Leader's final inventory review and signature in the private official copies.
- [ ] Actual Replit proof screenshots and judge access verification.
- [x] English slide deck and speaker-note links.
- [x] Demo-video link supplied.
- [ ] Trim the 7:28 video to the official 5–7-minute limit and verify judge access.
- [ ] Organiser decision about RunPod proof applicability.
- [ ] Official portal submission and saved receipt.

## Licence

Team application code: Apache-2.0, as in [LICENSE](LICENSE). Preserve [third-party notices](THIRD_PARTY_LICENSES/README.md). This repository follows the [official SDC template](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template) without claiming its example Python/GPU stack as our implementation.
