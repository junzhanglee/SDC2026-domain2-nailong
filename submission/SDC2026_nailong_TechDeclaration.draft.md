# SDC HACKATHON 2026 — Technical & Tools Declaration

**DRAFT — NOT READY FOR SUBMISSION.** Complete the official template with the team-reviewed inventory, actual versions, licences, evidence and signature. None of the pending declarations is pre-ticked.

## 1. Team & Project Overview

- Team: nailong
- Project: Nexus
- Leader: LING YUXUAN
- University: Xiamen University Malaysia
- Team size: 4 (leader + 3 team members)
- Responsibility areas: concept development / frontend debugging / backend debugging; individual assignments pending.
- Mandatory workshops: all members completed GenAI, Database and Cloud Deployment.
- Leader email / phone: [Included in the local private copy; omitted from the public repository draft]
- Live prototype: https://nexus-nailong-2026.d7ystszcjf.chatgpt.site/ [verify final submission version]
- Repository: https://github.com/junzhanglee/SDC2026-domain2-nailong
- Application branch: feat/orbyte-flow-mvp
- Replit project: https://replit.com/t/nai-long/repls/SDC2026-domain2-nailong-2
- Published Replit URL: [NOT YET PROVIDED OR VERIFIED]

## 2. Architecture & Technology Stack

### 2.1 System Architecture Overview — maximum 200 words

Nexus is a static browser application. HTML, CSS and native JavaScript render the interface; deterministic rules check synthetic stock and staff availability. A person confirms the request and an authorised role approves it. Approval rechecks the state before creating a linked task and activity record. Browser localStorage persists the demonstration within one origin. It is not a production database or security boundary.

Python's static HTTP server serves the source locally and in the Replit run setup. Node.js checks modules and contracts, runs business tests and copies assets into dist for static hosting. An existing Sites-hosted demo is available; Replit project import/run has been reported by the team. Publishing settings have been prepared in Replit, but a public Replit URL has not been verified here.

No runtime LLM, GPU inference, messaging provider, payment service or backend database is connected. OpenAPI files describe proposed internal interfaces. Production authentication, tenant isolation, transactional approvals and optional model-assisted extraction are future work.

### 2.2 Languages, Frameworks & Libraries

- HTML/CSS/native JavaScript ES modules: user interface and business workflow; no third-party JavaScript runtime libraries. Browser versions: [record actual tested versions].
- Node.js: tests and build checks, supported 22+; local verified runtime v24.19.0. Replit version: [capture actual version]. Licence: verify the distributed runtime's licence/third-party notices.
- Python 3 standard-library http.server: static development serving. Actual local/Replit versions and runtime licence: [confirm from environments].
- Team application repository: Apache-2.0 LICENSE present. Attribution/prior-source inventory: [TEAM TO REVIEW].
- Official submission template: documentation structure reference; [TEAM TO RECORD REQUIRED ATTRIBUTION/LICENCE IF COPYING TEMPLATE MATERIAL].

## 3. APIs & Cloud Services

### 3.1 External APIs

The currently reviewed application makes no external GenAI, payment, messaging or supplier API calls. Proposed contracts are not live APIs. [TEAM: confirm any additional external API use, including separate experiments, and list provider/purpose/tier.]

### 3.2 Cloud Platforms & Deployment

- Replit: repository import, run/preview and static publishing setup as reported in this conversation and supplied screenshots. Team workspace shown by project URL: nai-long. Plan, region, sponsor credits and actual published state: [TEAM TO CONFIRM].
- Sites: existing static demo hosting at the prototype URL. Provider/account plan, region and deployment version: [TEAM TO CONFIRM].
- GitHub: source hosting and revision history; local workflow file also exists. Actual remote CI run results, plan and judge access: [TEAM TO CONFIRM].
- RunPod: not used, as confirmed by the team. No GPU workload or endpoint is implemented. The applicability of the official sample requirement still needs organiser confirmation.

## 4. AI Tools, Models & Datasets

### 4.1 AI Models Used in the Solution

None in the current reviewed application. Extraction, summaries and recommendations use rules/statistics. Planned models are not reported as deployed models. [TEAM: disclose any separate implemented model component if added before submission.]

### 4.2 Datasets

- Nexus synthetic demonstration records: team-created example staff, stock, customers, requests, tasks and messages in apps/web/assets/data.js and related migration defaults. Used in application and business-rule evaluation; not model training. No real customer, employee or company records should be included. Synthetic names do not constitute a real user dataset. Licensing/ownership: [TEAM TO CONFIRM]; repository is Apache-2.0.
- DOSM MSME Performance 2024: background research reference in docs/product-design.md, not an application/training dataset. Do not label market statistics as product-effect measurements.
- Additional datasets or externally supplied evaluation records: [TEAM TO CONFIRM NONE OR DECLARE].

### 4.3 AI-Assisted Development Tools

- Codex / ChatGPT: code, debugging, interface/documentation work and submission drafting are evidenced in this conversation. Exact products/model versions and extent of use: [TEAM TO CONFIRM; do not infer from available model menus].
- Replit Agent: imported-project setup and publishing-configuration preparation are evidenced in supplied screenshots. Exact model/version and extent of use: [TEAM TO CONFIRM].
- Tools used by other members, image generation or code completion: [TEAM TO CONFIRM NONE OR LIST].

Review/responsibility statement — maximum 100 words:

AI-assisted output was checked using the project's existing business-rule tests, module/resource checks and build process. Local verification on 23 October 2026 passed 43 tests and the static build. Test coverage includes role restrictions, approval rechecks and duplicate execution. Replit screenshots separately report platform checks; the team must retain their evidence. Before signing, members must review the generated code, documentation, resource inventory and claims, verify the final public build, and accept responsibility for all submitted material.

## 5. Sponsor-Provided Resources

- Replit: [TEAM SELECT YES/NO for official sponsor resource use; importing/running on Replit does not alone establish use of sponsor credits]. Explain the actual development/runtime role and attach proof.
- RunPod: No — the team confirms no use. No RunPod account/usage evidence is claimed.
- Other sponsor API/credits/platform/data/mentoring: [TEAM SELECT YES/NO AND LIST].

Replaceability — maximum 100 words:

The current static prototype can run on any compatible static server without GPU compute. Replit provides a shared project/run environment for this submission; its actual sponsor-account use must be declared by the team. The workflow's rules and synthetic data do not depend on a proprietary model endpoint. Any later GPU or model integration must be documented with its role and fallback. Technical replaceability does not waive the organisers' resource-use requirements.

## 6. Security, Privacy & Responsible Use

### 6.1 Data Handling & Privacy — maximum 150 words

The intended demonstration uses synthetic business records. Names, messages, task changes and optional uploaded content entered by a user may be stored in that browser's localStorage; the application does not provide a server-side retention policy. Local records persist until site data is cleared and are not automatically shared across devices. Do not enter real personal or confidential business information. Browser-local role checks cannot protect records from the browser's owner. The application does not intentionally send these records to an AI API. Hosting providers may process ordinary connection metadata under their own policies. A production system would require server-side identity, tenant isolation, access controls, deletion/retention rules and review of data sent to authorised providers.

### 6.2 Known Limitations & Risks — maximum 150 words

No runtime AI model is connected, so generated-language functionality must not be claimed. Rules can miss unmodelled cases; missing fields require human confirmation. Client-side identity, role filtering, logs and localStorage are demonstrations, not production security. Browser data can be edited or cleared, and independent devices do not share state. Proposed supplier interfaces are not implemented integrations. Approval logic rechecks current synthetic stock and availability and prevents repeated actions within the demonstration, but production concurrency requires transactions and server-side idempotency. Development AI output may contain errors; automated tests cover selected business cases and must be complemented by team review and final deployment checks.

## 7. Compliance & Readiness Checklist

- [ ] All actual APIs, services, tools, models, datasets and sponsor resources declared.
- [ ] Licences and attribution checked by the team.
- [ ] Repository, evidence, prototype and document checked for credentials.
- [ ] All development AI use disclosed and reviewed.
- [ ] Sponsor resource use confirmed and supported with evidence.
- [ ] Final judge-facing links verified, including submitted source branch.
- [ ] All official-template fields and word limits checked.

## 8. Declaration

To be reviewed and signed by the team leader in the official template.

- Signature: [TEAM LEADER]
- Date: [ACTUAL SIGNING DATE]
