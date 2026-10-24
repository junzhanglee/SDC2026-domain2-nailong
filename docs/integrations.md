# Connect and AI Integration Plan

Every /api/v1/... path is a **proposed Nexus internal interface**, not a verified supplier endpoint. These supplier HTTP APIs remain unimplemented. A separate server-side `/api/ai/customer-request` endpoint now calls the OpenAI Responses API; see [AI integration](ai-integration.md). Contracts support future backend/adapter work.

The six proposed inputs cover payment events, accounting invoices, approved payroll hours, CRM contacts, ecommerce orders and WhatsApp webhooks. Confirm provider versions, permissions, mappings, rate limits, costs, signatures and event coverage individually before implementation.

## WhatsApp and Internal Chat

The plan uses authorised WhatsApp Business Platform messaging: customer messages become standard inquiry events through webhooks and appear in the inbox. Sending goes through a backend proxy under the applicable messaging/template rules. Do not embed private WhatsApp Web in an iframe or scrape personal accounts/groups. The earlier Meta documentation lookup was rate-limited; authorisation and messaging limits remain unverified and need checking before integration.

Internal chat has its own model. Production synchronisation would use WebSocket or SSE and enforce channel membership. Never automatically forward internal chat to customers. AI may read only selected authorised context; summaries should reference their source messages and consequential tasks require confirmation.

## Payments, Accounting, Payroll, CRM and Ecommerce

Payments trust verified provider events and server checks, not a customer's screenshot. Quotations, orders and invoices have separate objects/states; MyInvois integration, if required, needs independent verification against current official specifications. The prototype does not issue legally valid electronic invoices.

Payroll synchronises approved attendance/overtime only. Do not calculate payable wages without checking applicable rules and contracts. CRM maps authorised contacts and customer projects without default access to personal address books. Ecommerce normalises SKU, order, refund and inventory events with idempotency/version checks to prevent duplicate deductions.

## Optional AI Boundary

Selected customer-message extraction and editable reply drafts now use the server-side OpenAI Responses API. Chat summaries, HR analysis and monthly reviews remain deterministic demonstrations. The key is stored only in server secrets, never in client code. Initial live verification returned `credit_balance_exhausted`, so successful generation awaits API credits.

Possible backend additions are message-field extraction, evidence-based recommendation explanations, structuring OCR receipts and authorised-event monthly reviews. Each output records sources, version, missing fields and confidence, with human clarification when needed. Fixed code retains identity, permissions, approval and financial control.

## Errors and Recovery

Proposed responses: 422 missing/invalid fields, 401 unauthenticated, 403 insufficient permission, 409 duplicate/stale version and 503 supplier unavailable. Preserve source events and correlation_id, reuse idempotency keys on retry and route failures for human review. Do not relabel failed retries as success.
