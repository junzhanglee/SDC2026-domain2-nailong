# Permissions, Architecture and Implementation Boundaries

## Current Implementation

The prototype uses static ES modules with no third-party JavaScript runtime dependencies. engine.js contains business rules, data.js synthetic records and app.js rendering/input validation. localStorage persists a single-browser demonstration. Roles share one synthetic organisation; role switching binds fixed employee IDs and names are display labels.

The owner has global business visibility. Managers share the highest business permissions, subject to the owner-only broadcast exception. HR maintains staff and personnel review; Finance handles claims and financial sample events; employees see their own requests/tasks; Customer Service prepares customer work without final business approval. Public directory, shared channels and announcements are available across staff roles.

Only one operating team is modelled; this does not establish arbitrary organisation/multi-team authorisation. Managers can approve demo personnel requests; production must also enforce reporting_line and team_id relationships.

visibleRequests authorises personnel/financial records; visibleTasks scopes individual or operations-team work; visibleLogs separates personnel, financial and operational visibility. Approval functions independently check permissions and status, prevent self-approval/replay and recheck stock/availability.

**The browser owner can inspect or modify every local record. Role filtering demonstrates interaction, not production security.** Never enter real personal or confidential business records. Local logs are editable and chat is not a real multi-user service.

## Proposed Production Architecture

Nexus identity service → server session validation → tenant/role authorisation → business/rules service → approval state machine → outbox events → supplier adapters. The database separates tenants by tenant_id. Messages, attachments, tasks, approvals and events have unique IDs, creators and related-object references.

An order approval transaction reads current stock versions, availability and approval state. Version checks or row locks plus idempotency keys prevent concurrent approvals from duplicating tasks. Browser-state checks cannot replace this.

Receipts enter private object storage with type/size/malware checks before OCR. Staff confirm amount, date, merchant and currency. Send only minimal authorised content to a model; model output cannot establish compliance or payroll conclusions.

Customer messages originate from authorised business channels; shared channels enforce membership. Message content is untrusted and cannot change permissions, invoke financial services or bypass approval. Outbound messages, quotations, procurement and payments require separate actions within an explicitly approved scope.

Webhooks need provider-specific signature validation, retry policies and deduplication. Secrets remain server-side. Append-only events record actor, tenant, action, object, timestamp, correlation_id and outcome without exposing complete sensitive messages in logs.

## Test Coverage

Business tests cover stock/leave checks, Customer Service restrictions, employee visibility, Finance/HR isolation, stale recommendation checks, duplicate/self approvals, balance checks, CSV quoting/invalid input and replies that avoid payment/delivery commitments. Static checks cover module syntax, asset existence and contract structure. Report browser QA and deployment outcomes only when actually verified.

## Direct Messages and Notifications

Direct-conversation IDs sort the two employee IDs. Reading, sending, summarising and unread calculations check membership first. Highest business permission does not open others' direct conversations. Shared channels are available to all staff. Messages persist locally; storage events update same-origin tabs while preserving the receiving tab's identity. Opening a conversation marks it read. Ordinary chat does not trigger public-screen banners. All filtering remains a UI simulation because the browser owner can inspect the state.

## Owner Broadcast Permission

Top banners consume independent owner-broadcast records, never ordinary chats. Only owner has broadcast permission; managers are explicitly excluded despite other top business permissions. The owner must use the dedicated form. All logged-in roles can read broadcast details/history; readBy records individual read state. Same-origin events display new valid owner notifications. Sign-in/refresh replays unread owner notifications only, never ordinary chat. Production enforcement still requires a backend.
