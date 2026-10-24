# Nexus - Preliminary Proposal (revised review source)

Prepared 24 October 2026. Team: 奶龙 (nailong); Domain 2; SDG 8.2 / 8.3. Leader: LING YUXUAN. University: Xiamen University Malaysia. Four members: LING YUXUAN, LI JUNZHANG, XIE WEIYE, HU ZHAOMING. Leader contacts are retained in the PDFs as requested.

## 2.1 Problem

Small print and custom-gift businesses receive customer enquiries through messages while stock, staff availability and task ownership sit in separate records. Customer service staff or the owner repeatedly re-enter requirements, check who is available and ask colleagues for progress. Missing information and unclear handoffs can lead to premature delivery promises or requests with no accountable owner.

Nexus focuses on this recurring request-to-task burden for small Malaysian teams, initially targeting print and custom-gift businesses. This is a design hypothesis derived from the challenge brief and prototype scenario, not a completed customer-research finding. It matters economically because avoidable checking and follow-up consume limited staff time. The project prioritises productivity and accessible workflows rather than claiming measured financial or environmental savings. The initial workflow is designed for mixed digital confidence, a mobile interface, RM amounts and Malaysia time.

## 2.2 Solution

Nexus turns a customer message into a checked, human-approved task. Customer service confirms requirements; fixed rules inspect synthetic stock, staff skills and approved leave, identify missing information or conflicts, and suggest an assignee. An authorised demo manager reviews the proposal. Approval rechecks current data and prevents repeated execution before creating a linked task and activity record.

A deployed server-side OpenAI Responses API adapter can request structured extraction and an editable reply draft from GPT-4.1 mini. It processes only the message explicitly selected by staff and never approves work or sends a reply automatically. Live verification reached OpenAI but returned credit_balance_exhausted, so successful AI generation has not yet been verified. The manual and rules-based workflow remains usable.

Local Excel (.xlsx) and CSV employee-resource tables can be analysed without an AI call or Microsoft 365 account. Business data and demo roles remain browser-local; WhatsApp and online Microsoft workbook synchronisation are not connected. People, Work and Connect supply workflow context. Phase 2 will prioritise a narrow, tested handoff workflow and authorised integrations instead of claiming a complete enterprise platform.

## 3.1 Architecture

Nexus is deployed on OpenAI Sites as a Cloudflare Worker serving the frontend and backend endpoints. Browser-side rules check synthetic stock, staff availability and approved leave. Demo roles review proposals before linked tasks and activity records are created. Business records remain in browser localStorage.

For AI assistance, customer service explicitly submits one selected message to a same-origin backend endpoint. The backend requires ChatGPT sign-in, enforces daily usage limits in Cloudflare D1 and calls OpenAI Responses API using a server-side secret. Structured outputs and source evidence are validated before editable suggestions are returned. AI does not send replies, approve requests or create tasks automatically. Live verification reached OpenAI but was blocked by insufficient API credits.

Excel/CSV employee tables are read locally in the browser. WhatsApp and Microsoft 365 cloud synchronisation are not connected. Replit sponsor-provided premium access was used for development and testing; it is separate from the current Sites deployment.

## 3.2 Design thinking

We use understanding, prototyping, testing and iteration to focus on repeated request checking and handoff. The prototype makes each role's next action explicit and keeps consequential decisions with people. Sixty-one automated tests cover business rules, access-scope demonstrations, approval checks, AI input/output boundaries and Excel import validation. Browser checks verified representative workflows, real file reading and clear API failure feedback.

Before Phase 2, we plan to observe at least five target users completing matched tasks, record completion time, missing information and requests for help, then simplify the interface. We will replace the estimated manual baseline with observed timings. Real enterprise trials require server-side company membership and tenant authorisation, transactional business storage and recoverable external integrations. We will connect only an authorised business channel and validate one end-to-end scenario before widening scope. These are readiness actions, not completed production capabilities.

## 4. Impact framework

SDG 8.2 / 8.3: https://sdgs.un.org/goals/goal8

Baseline: Initial team estimate: 10 minutes of active staff handling per request - 3 minutes to structure requirements, 4 to check stock and staff, and 3 to assign and record the work. This is not an industry statistic or a measured pre-prototype baseline. It will be replaced with an observed manual baseline before impact claims are made.

KPIs: Median active staff minutes per request; percentage of requests missing required information; and percentage of critical actions with authorised human approval. Record failed tasks and sample size, not only successful completions.

Phase 2 target: Phase 2 target: reduce median active staff handling time by 30% versus the measured manual baseline (illustratively 10 to 7 minutes), while maintaining 100% human approval coverage for critical actions. Plan: at least five target users and 30 matched manual/Nexus task pairs. These are proposed evaluation targets, not achieved results.

## 6. IP declarations

Prior-owned work: No, as declared in the supplied proposal. Third-party resources: Yes - fflate 0.8.3 (MIT), Node.js (MIT and bundled notices), GPT-4.1 mini (proprietary API terms; credit-blocked generation). Employment IP conflict: No, as declared by the team. No signature is applied by this revision.
