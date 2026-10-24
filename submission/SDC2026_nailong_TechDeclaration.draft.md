# Nexus - Technical Declaration (revised review source)

Prepared 24 October 2026; deadline 25 October 2026. Team: 奶龙 (nailong); university: Xiamen University Malaysia. Leader contacts are retained in the PDFs as requested; leader signature pending.

Prototype: https://nexus-nailong-2026.d7ystszcjf.chatgpt.site/

Source: https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp

## 2.1 Architecture

Nexus is deployed on OpenAI Sites as a Cloudflare Worker serving the frontend and backend endpoints. Browser-side rules check synthetic stock, staff availability and approved leave. Demo roles review proposals before linked tasks and activity records are created. Business records remain in browser localStorage.

For AI assistance, customer service explicitly submits one selected message to a same-origin backend endpoint. The backend requires ChatGPT sign-in, enforces daily usage limits in Cloudflare D1 and calls OpenAI Responses API using a server-side secret. Structured outputs and source evidence are validated before editable suggestions are returned. AI does not send replies, approve requests or create tasks automatically. Live verification reached OpenAI but was blocked by insufficient API credits.

Excel/CSV employee tables are read locally in the browser. WhatsApp and Microsoft 365 cloud synchronisation are not connected. Replit sponsor-provided premium access was used for development and testing; it is separate from the current Sites deployment.

## 2.2 Languages and libraries

| Name | Purpose | Licence |
| --- | --- | --- |
| HTML5 | Accessible page structure and forms. | N/A - web standard |
| Modern CSS | Responsive layouts and glass effects. | N/A - web standard |
| JavaScript ES Modules (ES2015+) | UI, local business rules and workflow. | N/A - language standard |
| Node.js v24.19.0 | Local tests, build tools and preview server. | MIT; bundled components retain their licences |
| fflate 0.8.3 | Browser-local ZIP decompression for .xlsx imports. | MIT; full notice in THIRD_PARTY_LICENSES/fflate-MIT.txt |

## 3.1 External APIs

OpenAI Responses API - gpt-4.1-mini; paid, not sponsor-provided. Adapter deployed; successful generation blocked by API credit_balance_exhausted. Other vendor APIs remain unconnected.

## 3.2 Cloud services

| Service | Purpose | Plan / region |
| --- | --- | --- |
| OpenAI Sites | Hosting, deployment and server-secret configuration. | Managed; plan/region not verified |
| Cloudflare Workers via Sites | Backend endpoints and server-side OpenAI requests. | Platform-managed; region not verified |
| Cloudflare D1 via Sites | Daily AI usage counters only. | Platform-managed; location not verified |
| ChatGPT sign-in via Sites | Identity before AI requests; not enterprise membership. | Platform-managed; region not verified |
| Replit | Project import, development and testing. | SDC-provided premium access; region not verified |
| GitHub / GitHub Actions | Public code hosting and configured test/build workflow. | Repository public; plan/region not verified |

## 4.1 Models

GPT-4.1 mini, pre-trained, no fine-tuning/self-training; proprietary OpenAI API service terms.

## 4.2 Datasets

| Dataset | Source | Type | Licence | Personal data |
| --- | --- | --- | --- | --- |
| Nexus example business records | Team-created; apps/web/assets/data.js and customer-service.js | Synthetic | Apache-2.0 | N - fictional records |
| Workflow / file-import fixtures | Team-created; tests/ | Synthetic | Apache-2.0 | N |
| Entered messages and Excel/CSV content | User-provided during use | Private / user-provided | User-owned; permission required | Y - may include names or messages |
| Identity and AI usage counters | Sites identity and D1 ai_usage | Private / app-generated | Provider terms and privacy requirements | Y - platform identifiers |

## 4.3 AI development tools

| Tool | Use | Extent |
| --- | --- | --- |
| OpenAI ChatGPT; hosted version not recorded | Product planning, requirements, design guidance and text drafting. | Major |
| OpenAI Codex; desktop version not recorded | Code generation, debugging, tests, integration, deployment and documents. | Major |

Our team refines AI-generated code and text against project requirements. Verification includes 61 automated tests and browser checks of business rules, demo permissions, approvals, AI failure handling and Excel imports. Documentation distinguishes implemented functions, simulations and future work. Incomplete integrations and the API credit limitation are disclosed. Final review, submission accuracy and responsibility remain with the team; the leader must review and sign the official copies.

Any Replit Agent or other member tool use still requires factual team verification.

## 5. Sponsor resources

Replit premium access was provided by SDC and used for development/testing (team-confirmed).

Replit's SDC-provided premium access supported cloud development and testing. It was helpful but replaceable: the project can also run locally and is currently deployed through OpenAI Sites. The core workflow does not depend on Replit-specific services. RunPod was not used; the applicability of its required proof-of-use item must be confirmed with the organisers.

## 6.1 Privacy

Nexus stores entered names, profiles, messages, requests and activity records in browser localStorage until users clear site data. Excel/CSV files are processed locally and are not uploaded. AI requests send only the selected message and Malaysia date to OpenAI after an explicit user action. API keys remain in server secrets. AI access requires ChatGPT sign-in; platform user identifiers and daily usage counters are stored in Cloudflare D1. These counters currently have no automatic deletion schedule. Requests use HTTPS and store:false, which does not guarantee zero provider retention. Frontend role filtering is for demonstration, not production-grade authorisation. Users are instructed to use synthetic data and avoid sensitive information.

## 6.2 Risks

AI may misinterpret messages, invent details, produce biased wording or follow malicious instructions. Mitigations include structured outputs, source-evidence validation, missing-field handling and mandatory human review. AI cannot automatically send replies, approve requests, make payments or create tasks. Authentication, input limits and daily quotas restrict API access. Provider failures retain the original message and show an error. OpenAI is currently the sole model provider, and insufficient credits prevent successful generation verification. Business records remain browser-local, with no cross-device synchronisation or production tenant isolation. WhatsApp and Microsoft 365 cloud synchronisation are not connected.

## 7-8. Final review

Known components, secrets handling and working links are documented. The leader must confirm the complete team inventory, review declarations and sign the private official copy. No signature or sponsor evidence is fabricated.
