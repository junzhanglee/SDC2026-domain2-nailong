# Nexus · English speaker notes

12 core slides + 2 reference appendices. Target recording length: approximately 6½ minutes including the product demo.

## Slide 1

[15 seconds] Small businesses do not need another complicated system. They need the next customer request to become a clear, checked task. Nexus connects that handoff while leaving important decisions with people.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp
Decorative optical-glass artwork generated with OpenAI ImageGen for this presentation; not a product screenshot.

## Slide 2

[35 seconds] Our starting segment is small print and custom-gift teams in Malaysia. The recurring burden is not the customer message itself, but the repeated work needed to verify and hand it over. This segment is a hypothesis based on our challenge analysis, not a claim that we have completed SME interviews.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/product-design.md

## Slide 3

[35 seconds] In this synthetic case, the customer needs one hundred cups but only eighty are available. A confident reply alone is not enough. The workflow must expose the twenty-cup shortage, check employee availability and route the decision to a manager before anyone promises delivery.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/apps/web
Synthetic sample Q-1042; not an actual customer order.

## Slide 4

[35 seconds] Customers start in their own in-app account. Support confirms the details and creates a request. Nexus applies deterministic resource checks. Approval and commit-time checks prevent stale conditions or duplicate work from being silently accepted. A manager can review, edit or reject; the result becomes a named task and a browser-local activity record.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/customer-flow.md
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/architecture.md

## Slide 5

[45 seconds, including demo] Show the work overview and open the customer request or relevant task. Explain the owner and deadline beside each item. Counts come from the current role-visible records; this screen is a demo, not evidence of customer adoption. If the live page is unavailable, use this real screenshot to continue.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/dashboard.md
https://nexus-nailong-2026.d7ystszcjf.chatgpt.site/
Screenshot captured from the current local build on 24 October 2026.

## Slide 6

[40 seconds] This screenshot shows the business checks and handoff for the synthetic cup request. The displayed rule-based summary is not a verified model response. The deployed server-side OpenAI Responses API adapter targets gpt-4.1-mini, but the last live call was blocked by exhausted API credits. AI is optional assistance and cannot send messages, create payments or approve requests autonomously.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/ai-integration.md
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/architecture.md
Screenshot captured from the English prototype on 24 October 2026. WhatsApp is a synthetic source label, not a live connection.

## Slide 7

[25 seconds] Adoption depends on familiar language and data. Nexus has English, Chinese and Bahasa Melayu interfaces, Malaysia-local scheduling context, and local XLSX or CSV resource analysis. This is local file import, not a Microsoft Graph connection. Ordinary WhatsApp messages are not currently synchronised.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/excel-and-whatsapp.md
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/account-settings.md

## Slide 8

[40 seconds] The deployed frontend and AI endpoint are hosted through Sites with a Cloudflare Worker. Business records remain in localStorage; D1 stores only AI usage counters. The Worker authenticates AI access, validates requests, applies usage limits and calls the model using a server-side secret. Production identity, tenant authorisation and a transactional shared business database are Phase 2 work. The bottom line distinguishes current hosting from production readiness.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/architecture.md
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/ai-integration.md

## Slide 9

[30 seconds] We test workflow invariants such as stale-resource checks, repeated approvals, role-specific behaviour and language coverage. The repository test suite currently reports seventy passing tests. That does not establish production security: business roles and records remain browser-local. Shared enterprise use requires server-side membership, tenant authorisation, persistence and independent security review.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/tests
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/architecture.md

## Slide 10

[35 seconds] Our primary SDG alignment is 8.2, technological upgrading for productivity, and 8.3, MSME growth. Our provisional baseline is a ten-minute team estimate: three minutes to structure the request, four to check resources, and three to assign and record. The proposed goal is thirty per cent lower median active handling time against a measured manual baseline, alongside one hundred per cent approval coverage. Neither number is an achieved impact result. Pilot plan: at least five target users and thirty matched task pairs.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/submission/SDC2026_nailong_Preliminary.pdf
https://sdgs.un.org/goals/goal8
SDG 8.2 and 8.3 are paraphrased; no macroeconomic effect is claimed.

## Slide 11

[35 seconds] We apply design thinking as a testable loop: observe real work, define the narrow burden, prototype the handoff, test it and refine it. Before a real shared pilot, we must harden identity, authorisation and data persistence, restore successful AI verification and validate one authorised integration. We will compare matched manual and Nexus tasks rather than claim time saved from interface polish.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/submission/SDC2026_nailong_Preliminary.pdf
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/docs/product-design.md

## Slide 12

[15 seconds] Nexus turns customer messages into work people can understand, check and own. Our goal is less chasing and clearer decisions for small teams. Thank you. The following two slides are reference appendices and are not part of the timed pitch.

Sources / evidence:
https://nexus-nailong-2026.d7ystszcjf.chatgpt.site/
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp

## Slide 13

Reference only. Replit premium access was supplied by SDC and used by the team, as confirmed by the leader. The current prototype is hosted on Sites. RunPod was not used. Check the official technical declaration for the full resource inventory and applicable terms. Sponsor proof screenshots and the final video remain separate submission items.

Sources / evidence:
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/submission/SDC2026_nailong_TechDeclaration.pdf
https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp/submission/README.md

## Slide 14

Official handbook: https://drive.google.com/file/d/1fGBS-jevDj_FrF8wsbYNPzyU5TTrfk1V/view
Handbook downloaded and checked on 24 October 2026. §6.3.5.2 specifies pitch coverage. §6.3.5.6 specifies a 5–7-minute YouTube video with prototype demonstration. No slide-count requirement was found in those sections.
SDG source: https://sdgs.un.org/goals/goal8
Repository: https://github.com/junzhanglee/SDC2026-domain2-nailong/tree/feat/nexus-mvp
Source proposals: submission/SDC2026_nailong_Preliminary.pdf and submission/SDC2026_nailong_TechDeclaration.pdf.
Cover asset: AI-generated decorative glass artwork, generated 24 October 2026.
This deck was created with OpenAI Codex assistance and @oai/artifact-tool; team review is required before submission.

Sources / evidence:

