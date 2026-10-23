# SDC HACKATHON 2026 — Phase 1: Preliminary Project Proposal

**DRAFT — NOT READY FOR SUBMISSION.** Transfer reviewed content into the official template. Resolve every bracketed field, confirm word limits, and obtain the team leader's signature.

## 1. Team & Project Overview

- Team Name: nailong
- Selected Domain: Domain 2 — Orbyte Smart SME Challenge
- Selected SDG Track: SDG 8 — Decent Work and Economic Growth
- Project / Solution Name: Nexus
- Name (Leader): LING YUXUAN
- Email & Phone (Leader): [Included in the local private copy; omitted from the public repository draft]
- University Affiliation(s): Xiamen University Malaysia
- Number of Team Members: 4 (leader + 3 team members)
- Responsibility areas: concept development, frontend debugging and backend debugging. Individual member-to-role assignments are pending; a backend responsibility does not imply a deployed backend.

## 2. Executive Summary & Problem Statement

### 2.1 The Problem Context — maximum 250 words

Malaysian micro and small businesses often coordinate customer requests through messages while stock, staffing and task records remain separate. For a small print or custom-gift business, an urgent order can require the owner to check quantities, approved leave, available skills and delivery expectations manually. A missed check can lead to an unrealistic promise, repeated follow-up or an unowned task.

Nexus focuses on this specific enquiry-to-fulfilment handoff. The initial target is a small team producing printed or customised goods; team size and adoption assumptions remain hypotheses rather than validated market findings. The domain brief identifies disconnected messages, spreadsheets and manual follow-up as relevant SME burdens. Our prototype demonstrates the failure mode using team-created synthetic records rather than real customer or employee data.

The economic aim is to reduce avoidable coordination work while keeping consequential decisions with people. Evidence of actual time savings and user adoption is still to be collected; we do not claim measured commercial or environmental impact.

### 2.2 The Proposed AI Solution — maximum 300 words

Nexus turns a customer enquiry into a checked recommendation, human approval, linked work task and activity record. In the demonstration, a request for 100 customised cups is checked against stock of 80, staff skills and approved leave. The proposed assignment is reviewed by an authorised manager. Approval rechecks current information and creates one blocked task while replenishment remains unresolved, rather than promising delivery.

The current prototype uses deterministic rules, not a deployed AI model. Proposed AI assistance would extract candidate quantities, dates and product references from unstructured messages and draft explanations using authorised business context. A person would confirm missing or uncertain fields. Fixed code would continue to enforce permissions, approval and duplicate-action prevention. This separates useful language assistance from accountable business decisions.

The workflow is designed as a reusable capability for the Orbyte ecosystem; simulated People, Work and Connect modules supply context. The innovation is the customer-to-fulfilment handoff, not reproducing HR administration. The team intends to apply workshop learning to server-side data architecture, optional GenAI integration and cloud deployment. All members have completed the mandatory GenAI, Database and Cloud Deployment workshops. Specific sponsor services and credits still require confirmation.

## 3. Technical Architecture & Implementation Plan

### 3.1 Conceptual Tech Stack

Current implementation: HTML/CSS/native JavaScript ES modules; browser rules and approval state; localStorage with synthetic records. Python 3 serves static files; Node.js 22+ performs business tests and build checks. The team has reported running the project in Replit; an existing Sites-hosted demo is available. Public Replit publication has not been verified.

Current block diagram:

```text
Customer/support input → confirmed order fields
  → synthetic stock + staff + approved leave
  → deterministic recommendation → authorised human approval
  → linked task + local activity record
```

Planned production diagram (not implemented):

```text
Authorised message source → authenticated backend → tenant-scoped database
  → optional model proposes fields → human confirmation
  → rules + transactional approval → task/event store → authorised adapter
```

Sponsor resources: Replit project import/run reported by the team; attach proof. The team confirms RunPod was not used. [TEAM: confirm sponsor-account/credit use, any GenAI service and resource terms.] Proposed internal OpenAPI contracts do not represent deployed backend or supplier integrations.

### 3.2 Design-Thinking & Deployment Strategy — maximum 200 words

We selected one concrete handoff rather than building a broad administrative suite: an urgent customised order requiring stock and availability checks. We mapped the request, connected information, decision, approval and visible result, then built an interactive synthetic-data prototype. This is hypothesis-driven design work, not evidence that SME interviews have already occurred.

Before Phase 2, we plan to observe target users handling comparable requests manually and with Nexus, record completion time and missed checks, and test whether a first-time user can finish without formal training. Findings will guide field labels, exception handling and onboarding.

The static build is reproducible and the core rules have automated tests. Replit can run the same source; publishing settings use the generated dist directory. We will verify the final public link and a fresh-session end-to-end demonstration before submission. A real deployment would additionally require server-side authentication, tenant isolation, transactional approvals and persistent events. If messaging or model access is unavailable, confirmed manual entry and deterministic rules remain the demonstration fallback.

## 4. Preliminary Environmental & SDG Impact Framework

- **Target SDG sub-targets:** 8.2, productivity through technological upgrading and innovation; 8.3, support for entrepreneurship and growth of micro and small enterprises. Source: official Domain 2 brief, PDF physical page 2.
- **Current problem baseline:** [REQUIRED BEFORE SUBMISSION: numeric baseline with source/method; not yet measured.] Plan a repeatable set of synthetic orders, including stock shortage, approved leave, missing fields and duplicate approval. Record manual handling minutes and omitted required checks per order. Do not treat this test as field validation with actual businesses.
- **Core measurable KPI:** preparation time per order in minutes; missed required checks per order; first-attempt completion rate without instructor intervention. Record sample size, scenario set and measurement rules.
- **Phase 2 impact target:** provisional 30% reduction in median preparation time and 50% reduction in missed checks relative to the same-scenario baseline. These are unverified targets; revise after measuring the baseline. Avoid percentage claims when the baseline count is zero.
- **Measurement calculation:** time improvement = (baseline median − assisted median) / baseline median × 100%. Compare equivalent scenarios and report sample sizes. No quantified environmental saving is claimed.
- **Sources:** [official Domain 2 folder](https://drive.google.com/drive/folders/1CkbeLBfsRaPjyIDdTmzIXnKJ3aD9MZQk); team prototype and planned scenario evaluation. [Add any published baseline source if used.]

## 5. Eligibility & Readiness Checklist

- [x] All members completed mandatory GenAI, Database and Cloud Deployment workshops — confirmed by the team.
- [ ] Real-world problem and SDG mapping verified by the team.
- [ ] Functional deployed application objective and final accessible build confirmed by the team.
- [ ] Every official-template field completed within its word limit.

## 6. IP & Originality Declaration

### 6.1 Pre-Existing / Prior-Owned Work

[TEAM MUST SELECT YES/NO and identify any code, design, research or other material owned before the hackathon. Commit timestamps alone do not establish originality.]

### 6.2 Third-Party Code, Datasets, or Models

[TEAM MUST SELECT YES/NO and complete the inventory and licences. The current application has no third-party JavaScript runtime dependencies; this does not settle the status of assets, prior code or all team resources. Declare AI development assistance in the technical declaration.]

### 6.3 Employment-Related IP Conflicts

[TEAM MUST SELECT YES/NO after checking every member's applicable employment, internship or consulting agreements.]

## 7. Declaration

The team leader must review and complete the official declaration. No signature or affirmative certification has been supplied by this draft.

- Signature: [TEAM LEADER]
- Date: [ACTUAL SIGNING DATE]
