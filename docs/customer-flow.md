# Customer Entry and Support Handoff

The sign-in page separates staff and customer entry. Customer entry uses two fixed synthetic customer accounts, Bunga Café and Kedai Kita. A display name opens the dedicated support conversation. This is not password authentication, registration or real multitenancy.

## Workflow

1. Customers send internal support messages and see only their selected customer's conversation and request summaries.
2. Customer Service selects a customer in the inbox, replies or converts a message into a request. One message can produce only one request.
3. Creation confirms quantity, requested date, proposed assignee and reviewer. Only Customer Service has create-inquiry permission. Other roles have no creation entry and direct function calls are rejected.
4. Rules check stock, capacity and approved leave. The request awaits approval. An assignee may be selected or suggested automatically; if a selected employee is unavailable, the system does not silently substitute another person.
5. The assignee sees the pending handoff in Work and the manager sees the request in approvals. The designated reviewer handles it; the owner retains global business-approval override authority.
6. Only successful approval creates a task. Insufficient stock leaves the task blocked and cannot justify a delivery promise.

## Visibility

Customer conversations are separate from internal chats and owner broadcasts. Customers cannot access People, Work, Connect, approvals, internal logs or staff profiles. Request summaries exclude internal scheduling suggestions, reviewers and other customers' data. Customer Service sees conversations; managers and employees receive handoff information through requests and tasks.

migrateCustomerService fills missing customer fields without clearing existing business records. Legacy requests remain; only requests explicitly linked to a customer ID appear in that customer's account.

## Boundaries

This is a same-origin browser demonstration. Tabs on the same origin can synchronise; different browsers/devices do not. localStorage contains the demo organisation state and UI/function checks are not production isolation. Real accounts, server-side permissions, message storage, concurrency handling and realtime delivery need a backend.

Business logic lives in customer-service.js; customer entry, portal and support forms in customer-ui.js; styling in customer.css. engine.js retains approval execution.
