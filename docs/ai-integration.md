# OpenAI customer request integration

Nexus uses OpenAI Responses API (`gpt-4.1-mini`) for extracting a selected customer message and preparing an editable reply draft. It does not send messages or create tasks automatically. Service: `worker/index.js`; UI: `assets/ai-client.js`.

## Status

The adapter, UI and server secret are configured. A live synthetic request reached OpenAI on 2026-10-24 but returned HTTP 429, `credit_balance_exhausted` / `insufficient_quota`. This is a billing blocker, not a successful model generation. The project owner must add API credits before successful end-to-end generation can be demonstrated. Do not claim this is sponsor-provided usage without separate evidence.

## Architecture and boundaries

Sites hosts an ESM Worker with embedded static assets, preserving the existing URL. It supplies trusted ChatGPT identity headers. `POST /api/ai/customer-request` rejects anonymous and cross-origin requests, validates the selected message and calls OpenAI with `store:false` and a strict JSON schema. It returns only validated extraction, source evidence and a draft; no model tools are enabled. `store:false` is not a claim of zero provider retention.

The model receives only the message the staff member explicitly submits and the Malaysia date. It does not read whole conversations, HR records or browser storage. Missing facts stay null. Frontend output is escaped; original messages remain available on failure. Human staff verify fields and edit drafts; separate existing business rules and approval logic control workflow execution. Browser-selected roles remain demo roles, not server-verified company membership. The API is a bounded signed-in demo service for user-supplied text, not a production tenant data service.

D1 `DB` holds `ai_usage` counters only: 10 attempts per authenticated user per UTC day and 100 total per UTC day. Atomic conditional UPSERTs enforce limits across Workers. Failed provider calls consume attempts too; a user-limit rejection may conservatively consume a global attempt. Counters contain platform user IDs but no message content; they are not audit records. All existing business/customer records remain browser-local and do not sync across devices. Do not enter sensitive real data into this demo.

## Keys and development

The runtime reads `OPENAI_API_KEY` from a hosted Sites secret. Local `.env.local` is ignored by Git; `.env.example` documents the name only. The newly provisioned key lifetime was selected as 30 days; rotate deliberately before expiry. Build only embeds files under `apps/web`; it does not copy local secrets.

Run `npm run build`, then `npm run dev` with Node.js 24+. Preview binds to 127.0.0.1 and uses an explicit local-only identity and in-memory SQLite quota database. Never deploy `scripts/dev.mjs` or treat its identity as real authentication. Hosted migration `drizzle/0000_ai_usage.sql` creates the D1 table through Sites deployment, not request-time SQL.

## Verification

Tests cover authorization, origin checking, input bounds, quota exhaustion, structured result/evidence validation, missing data, refusal/incomplete responses and sanitized provider errors. A live billing failure must not be reported as a successful generation.

Official references: [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini).
