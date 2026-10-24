# Profile and Settings

The top-right avatar and sidebar user card open the account menu: profile, settings, demo identity switching and sign-out. Sign-out ends the local Nexus demo identity; it does not sign out of another service or revoke a real server session.

## Available to Every Role

Profile includes name, work email, phone, biography, avatar, fixed employee ID and role, personal work summary and personal export. Saving changes only the current fixed demo employee; role and permission fields are rejected. Avatars accept small PNG/JPEG/WebP data, not SVG, remote URLs or secrets.

Personal settings include chat unread counts, compact layout, reduced motion and reduced transparency. The interface language selector offers Simplified Chinese (`zh-CN`), English (`en`) and Bahasa Melayu (`ms`). Language changes apply immediately and persist per demo employee ID in this browser, including after refresh; they do not reset business records or other preferences. Time zone and currency remain MYT and MYR.

The local UI catalog translates navigation, settings, key workflow controls, prompts and accessibility labels. Names, customer messages, project/task titles, logs, entered text and uploaded data remain in their original language. This is interface localization, not an automatic translation service. Original option values and business status identifiers are preserved when their displayed labels change. The selected language also updates the document language and date/time display locale. No additional API or translation provider is used.

Security shows the current simulated browser session, identity switching and sign-out. Password changes, two-factor authentication and remote session revocation require a real identity backend. The prototype explains their unavailable status rather than collecting passwords through non-functional forms.

Privacy export contains the user's profile, leave/claim/overtime requests and work records. Visible logs are exported separately under current permissions. Cloud backup, retention controls, account deletion and subscription payments are explicitly not enabled. Help includes FAQs, capability boundaries, version and project notes.

## Owner and Manager Features

Company settings include name, industry, state, email, phone and address. Saving updates workspace context but does not establish integration with state holiday calendars.

Members and permissions show the existing organisation and role boundaries. Real invitations, account disabling and role grants require an identity backend. Profile editing cannot elevate privileges. Public-screen notification publishing remains owner-only.

Approval settings configure demo annual leave allowance, claim review threshold and overtime anomaly threshold. Values are validated and saved atomically with an activity record. Leave allowance applies to balances, requests and approval; claim/overtime thresholds affect prompts and new requests. Reducing an allowance does not revoke approved records. These are demo policies, not statutory entitlement or payroll calculations.

Connection management opens Connect with proposed integrations and sample events. Never place API keys in browser settings or a public repository.

## Permissions and Data

Profiles are keyed by employee ID; company settings and policies belong to the global demo organisation. The independent preferences module validates identity, fields and permissions for writes rather than relying only on hidden controls. Old states receive defaults for new fields without clearing existing demo data.

This remains a frontend prototype. The browser owner can inspect and modify all local records. Real identity, isolation, verification, audit controls and cross-device persistence require a backend.
