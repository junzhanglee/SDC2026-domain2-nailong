# Dashboard: Act on Work Before Reviewing Projects

The home page presents a short greeting, work metrics, actionable items and current projects. Large promotional sections, decorative slogans, demo bar charts and duplicate introductions were removed. Tasks dominate the desktop layout; projects are secondary. Mobile follows the same priority in one column.

## Metric Definitions

- Pending approval: customer plans and leave/claim/overtime requests the current role can approve, excluding self-requests and plans reserved for a different reviewer. The owner retains existing global business-approval authority.
- Due soon: today and the next two calendar days in Malaysia, excluding overdue and completed items.
- Overdue: an incomplete item with a valid due date before today in MYT.
- Blocked: a visible task explicitly marked blocked or containing a non-empty blocking reason. Show the recorded reason; do not infer unrecorded risk.

These four filters are independent and may overlap; never sum them into a fabricated total. A missing date is displayed as unset. Leave start dates and overtime dates describe requests, not approval deadlines. Customer delivery dates are labelled as requested delivery dates.

## Items and Actions

Order items by overdue, blocked and personally actionable approvals, followed by customer-service follow-ups and ordinary tasks. Each row contains its name, next action, recorded evidence, date, owner and action control.

Start/complete controls use the existing task actions. Blocking details offer contact with a manager/assignee and the existing manager unblock action. Customer plans and staff requests use the existing approval functions. Request creation remains a subdued secondary customer-service action; other roles have no creation entry.

Project summaries derive remaining and total counts from currently visible tasks rather than fixed demo progress percentages. Prefer explicit project identity; separate named projects must not merge merely because they share a customer. Project entry filters the dashboard items.

Empty lists show a short explanation and clear-filter control without promotional filler. Recompute after changes while preserving permission boundaries, the business state machine, customer identity and chat rules.

## Implementation and Verification

Derived data lives in dashboard-model.js, rendering in dashboard-ui.js and styling in dashboard.css. No additional synthetic dashboard records or statistics constants were added. Existing browser business state supplies the data and the demonstration-data notice remains visible.

Tests cover MYT date boundaries, ordering, permissions, self-approval exclusion, invalid/missing dates, customer replies, project identity and actual empty states. The previous browser review recorded 1440×900, 1280×800, 768×1024, 390×844 and 375×667 layouts, horizontal overflow, first-item action visibility and metric/project/start-task interactions.

The recorded default-data review placed the bottom of the first blocking-action button around y=462 at widths 1440/1280, y=489 at 768 and y=591 at 390/375, within the corresponding initial viewports. Document width matched viewport width at those sizes. Empty-data review did not add promotional placeholders. These are earlier recorded observations, not a fresh browser check on every documentation edit.
