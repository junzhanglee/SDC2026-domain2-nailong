# Nexus Frontend Design

Nexus uses a consistent workspace: white content surfaces, light-grey navigation and blue primary actions. The interface retains People, Work, Connect, direct messages, owner notifications, profile and settings.

## Design References

The original design work recorded use of [emil-design-eng](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) for restrained animation, immediate press feedback, explicit transition properties, layered shadows and consistent detail, and [apple-design](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md) for hierarchy, system typography, size-specific tracking, material depth and accessibility preferences. No React or animation dependencies were added; the existing static modules support the interactions.

## Workspace

- The dashboard prioritises actionable metrics, tasks and project summaries. Marketing heroes and decorative English copy were removed. See dashboard.md for sorting, filtering and counting rules.
- Body content and forms use opaque surfaces. Small, low-contrast text receives larger type or stronger contrast; numbers use tabular figures.
- Glass effects are concentrated in the sticky header, notifications and dialogs, with blur limited to 16px. The sidebar uses a stable light-grey surface to avoid large transparent layers.
- Primary actions are blue, secondary actions white and destructive actions use red semantics. Statuses always include text rather than relying solely on colour.
- Component styling is concentrated in apps/web/assets/glass.css, preserving the base layout. interaction-ui.js handles interaction details; engine.js retains approval and permission rules.

## Motion and Input

Frequent navigation, contact selection and message scrolling respond immediately without full-page entrance animation. Press feedback lasts approximately 140ms, dialogs 200–240ms and notifications 240ms. Transitions target explicit properties such as transform and opacity. Keyboard input does not animate. System and personal reduced-motion preferences take precedence; reduced transparency and stronger contrast have fallback styles.

Dialogs have accessible names and restore focus to their trigger when closed. Page navigation focuses the heading; role and tab switches retain focus.

## Mobile Layout

Navigation becomes an overlay drawer. Closed navigation is not focusable; when open, the background is inert and Tab stays inside the drawer. Escape or the backdrop closes it. Mobile form inputs use at least 16px text and primary touch targets at least 44px. Compact settings must not shrink navigation targets. Columns reflow at breakpoints, project summaries stack and chat contacts form a horizontal list.

## Verification Scope

Use the existing business tests, syntax checks and build checks. Browser review covers the dashboard, chat, dialogs, settings, navigation focus and horizontal overflow. UI refactoring must preserve permissions, notification routing and storage keys so existing browser demo data remains usable. The website interface remains in Chinese; English repository documentation is not a localisation claim.
