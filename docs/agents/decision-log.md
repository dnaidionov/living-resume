# Decision Log

Use this log for concise, chronological records of meaningful decisions that do not require a full ADR.

## Entry Template

- Date (YYYY-MM-DD)
- Agent role
- Decision
- Rationale
- Scope impact (files/surfaces affected)

## Entries

### 2026-03-06

- Agent role: Content Strategist
- Decision: Removed `Selected Initiatives` and `What to ask next` sections from homepage experience area.
- Rationale: User requested a tighter experience narrative focused on primary resume evidence and AI context.
- Scope impact: `components/home-page-shell.tsx`, `app/page.tsx`.

- Agent role: Content Strategist
- Decision: Updated `View AI Context` role card panel to render project-level context blocks (`Situation`, `Approach`, `Work`, optional `Lessons Learned`) instead of blended role-level narrative when project contexts exist.
- Rationale: Prevent conflation of multiple initiatives and keep context specific to the project being described.
- Scope impact: `components/role-card.tsx`.

- Agent role: Content Strategist
- Decision: Simplified AI context presentation to a single panel with heading hierarchy and paragraph blocks; removed nested panel-in-panel visual structure.
- Rationale: Reduce cognitive load and improve readability while keeping project boundaries explicit.
- Scope impact: `components/role-card.tsx`.

- Agent role: Content Strategist
- Decision: Added tabbed project navigation inside AI Context for multi-project engagements; single-project engagements remain non-tabbed.
- Rationale: Preserve project-level separation while reducing vertical scanning in long multi-project contexts.
- Scope impact: `components/role-card.tsx`.

- Agent role: Content Strategist
- Decision: Updated AI Context toggle copy to switch between `View AI Context` and `Hide AI Context` based on panel state.
- Rationale: Improve control clarity and match explicit open/close state.
- Scope impact: `components/role-card.tsx`.

- Agent role: Content Strategist
- Decision: Added animated open/close transitions for AI Context panel using eased height, opacity, vertical offset, and margin transitions.
- Rationale: Prevent sudden layout jumps and make long-text panel expansion feel smoother and visually cohesive.
- Scope impact: `components/role-card.tsx`.

- Agent role: Content Strategist
- Decision: Rewrote static Experience-section headers and intros on homepage and resume page to professional resume language and removed showcase/meta framing.
- Rationale: Align page voice with recruiter-facing resume conventions and avoid third-party case-study tone in Experience framing.
- Scope impact: `components/home-page-shell.tsx`, `app/resume/page.tsx`.

- Agent role: Content Strategist
- Decision: Logged editorial and recruiter review notes in a dedicated artifact and applied prioritized copy corrections for typos, wording consistency, and reduced meta-product phrasing in static sections.
- Rationale: Preserve review traceability and improve resume-readability tone without altering experience claims.
- Scope impact: `docs/agents/editorial-recruiter-notes-2026-03-06.md`, `components/hero.tsx`, `components/home-page-shell.tsx`, `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Applied role-summary tightening across resume entries and added a static current-focus line in Experience using user-approved wording.
- Rationale: Increase recruiter scan speed, improve current-role relevance signaling, and align summary style across roles.
- Scope impact: `content/resume/roles.json`, `components/home-page-shell.tsx`.

- Agent role: Content Strategist
- Decision: Removed secondary Experience intro sentence and increased visual prominence of the current-focus line through stronger typography.
- Rationale: Keep section framing concise and prioritize immediate relevance signal for recruiters.
- Scope impact: `components/home-page-shell.tsx`.

- Agent role: Content Strategist
- Decision: Reduced visual intensity of the current-focus line while preserving readability by shifting to muted color and slightly lighter type scale/weight.
- Rationale: Keep emphasis present but avoid overpowering primary section heading hierarchy.
- Scope impact: `components/home-page-shell.tsx`.

- Agent role: Content Strategist
- Decision: Restored original current-focus typography scale and weight, and further reduced perceived brightness using opacity on muted text color.
- Rationale: Preserve emphasis hierarchy while making the line less visually bright.
- Scope impact: `components/home-page-shell.tsx`.

- Agent role: Content Strategist
- Decision: Applied user-approved achievement rewrites across role entries with accepted language fixes and polish, while preserving the existing Cardstack low-code/no-code bullet.
- Rationale: Improve action/outcome clarity, ownership signaling, and consistency without altering core factual scope.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Restored the missing Acision value-added SMS services work into Acision achievements based on prior documented context in repository artifacts.
- Rationale: Preserve completeness of telecom product scope and avoid regression to an attrition-only representation.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Replaced Acision SMS achievement detail with generalized wording to avoid naming specific products while retaining scope and impact framing.
- Rationale: Keep statement concise and confidentiality-friendly while preserving core claim.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Refined the Acision SMS achievement to a middle-ground wording that keeps confidentiality while adding clearer user-value language.
- Rationale: Improve readability and specificity without reintroducing product-name detail.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Corrected typo in Vingis AI context approach text (`roadmaping` -> `roadmapping`).
- Rationale: Maintain content quality and editorial consistency.
- Scope impact: `content/ai-context/explainers.json`.

### 2026-03-07

- Agent role: Ops / Release Agent
- Decision: Standardized the Cloudflare release path on an explicit OpenNext adapter build with committed repo config and a required `npm run cf:build` gate.
- Rationale: The previous runbook and Wrangler config pointed at `.open-next` artifacts that the repo could not actually generate, which left Cloudflare deployment documented but not release-ready.
- Scope impact: `package.json`, `wrangler.jsonc`, `open-next.config.ts`, `docs/operations/runbook.md`, `docs/architecture/deployment-cloudflare-openai.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `README.md`.

- Agent role: Ops / Release Agent
- Decision: Converted the Cloudflare and Vercel release steps in the runbook into explicit deployment checklists.
- Rationale: The deployment path was documented, but release execution is clearer and less error-prone when operators can verify each prerequisite and smoke test as a checklist.
- Scope impact: `docs/operations/runbook.md`.

- Agent role: Ops / Release Agent
- Decision: Made the embeddings rebuild trigger explicit: rebuild only when indexed content changes, regardless of agent role, and skip rebuilds for code-only changes.
- Rationale: Prevent unnecessary OpenAI embedding spend during normal app development while keeping retrieval artifacts current when the corpus changes.
- Scope impact: `docs/operations/runbook.md`, `docs/agents/handoffs.md`.

- Agent role: Ops / Release Agent
- Decision: Standardized standalone repo scripts to load `.env.local` automatically.
- Rationale: Keep local secret handling out of git while making script behavior consistent across shell sessions and future threads.
- Scope impact: `lib/env/load-local-env.ts`, `scripts/build-embeddings.ts`, `scripts/build-content-index.ts`, `docs/operations/runbook.md`.

- Agent role: Content Strategist
- Decision: Strengthened EPAM AI Experience AI-context wording to explicitly capture multi-agent orchestration, Anthropic/Claude implementation details, and added `LLM Orchestration` skill while preserving requested wording constraints.
- Rationale: Improve precision and evidence depth for LLM orchestration claims in hero and role narrative alignment.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Removed the word `anonymized` from EPAM AI-context summary wording.
- Rationale: Align wording with requested tone while keeping confidentiality handled implicitly through client naming choices.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Updated EPAM achievement phrasing from `fleet-management` to `fleet management`.
- Rationale: Match requested style preference for this term.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Expanded Modus content to separate telecom white-label cloud services redesign from Product Kickstart productization in both Experience and AI Context, and added Modus demonstrated skills for research, executive communication, and data-informed decisions.
- Rationale: Preserve project-level separation and reflect user-provided scope accurately without changing broader summary positioning.
- Scope impact: `content/resume/roles.json`, `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Updated Modus role-level AI-context headline and summary to explicitly reflect both telecom redesign execution and workshop productization tracks.
- Rationale: Improve top-level explainer framing coherence with the now-separated Modus project contexts.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Replaced Modus role-level AI-context headline with user-provided wording.
- Rationale: Align headline voice and framing exactly with requested positioning.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Kept anonymized client sectors in the EPAM role summary, reordered EPAM healthcare ahead of fintech while preserving fintech wording, retained EPAM cross-functional governance/alignment explainer lines, and tightened Modus telecom project `work` wording by removing `client leadership`.
- Rationale: Preserve recruiter-facing specificity on buyer contexts without breaching confidentiality, align bullet ordering with requested narrative flow, and maintain already-approved ownership framing in explainers.
- Scope impact: `content/resume/roles.json`, `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Applied EPAM achievement rewrites for AI, DevEx, and healthcare bullets while preserving the fintech bullet text unchanged; kept client sectors in EPAM summary and maintained healthcare-before-fintech ordering.
- Rationale: Align requested ownership framing and specificity while preserving the approved fintech wording and narrative sequence.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Updated Modus role summary and achievements to separate telecom cloud-solution redesign work from workshop productization and preserve the Product Kickstart bullet.
- Rationale: Improve strategic-ownership signal and avoid conflating distinct project tracks under one role.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Updated EPAM and Modus explainer headers/summaries and ensured EPAM key decision/execution wording reflects cross-functional governance and alignment language, plus Modus telecom work wording excludes `client leadership`.
- Rationale: Keep explainers aligned with accepted narrative constraints and recruiter-facing clarity.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Reconciled EPAM role achievements to the accepted preview phrasing (AI, DevEx, healthcare), preserved the fintech bullet unchanged, and tightened Modus role text to explicitly include white-label telecom redesign plus research-backed planning while retaining Product Kickstart.
- Rationale: Apply accepted wording at text level (not only ordering) and preserve user-specified exception for fintech.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Reduced EPAM role-level explainer `keyDecisions` and `execution` to the requested governance/alignment lines and retained Modus telecom project `work` wording without `client leadership`.
- Rationale: Match requested explainer constraints exactly and avoid introducing additional prescriptive execution language.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Applied user-confirmed EPAM and Modus wording from provided diff set, with explicit exceptions preserved: EPAM fintech achievement left intact, EPAM healthcare before fintech ordering, EPAM explainer key decision/execution constrained to governance/alignment lines, and Modus telecom project `work` excludes `client leadership`.
- Rationale: Ensure deterministic alignment to approved language while preserving previously declared constraints and confidentiality framing preferences.
- Scope impact: `content/resume/roles.json`, `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Applied reviewer-specified EPAM wording corrections in role achievements to restore client context (automotive leader, leading US telecom provider, major medical device manufacturer) and normalize style (`first year`, `call center`).
- Rationale: Align role statements to requested specificity and typography consistency while preserving accepted achievement structure.
- Scope impact: `content/resume/roles.json`.

- Agent role: Content Strategist
- Decision: Restored full EPAM role-level AI-context `keyDecisions` and `execution` arrays to include compliance-prioritization, AI quality controls, pre-rollout validation criteria, and cross-product coordination language.
- Rationale: Match user-approved explainer framing from the agreed diff comments and recover missing strategic/operational signals.
- Scope impact: `content/ai-context/explainers.json`.

- Agent role: Content Strategist
- Decision: Added role-level EPAM AI-context execution language to explicitly represent integration strategy, L&D enablement collaboration, and GTM participation as recurring capabilities across projects.
- Rationale: Existing project evidence showed these patterns but they were under-signaled in capability framing for PM requirement matching.
- Scope impact: `content/ai-context/explainers.json` (`ctx-epam.execution`).

- Agent role: Content Strategist
- Decision: Added EPAM AI-context outcome and skill signals for cost-estimation ownership and SQL/database capability alongside integration/GTM/training skills.
- Rationale: Improve coverage of PM screening criteria (business-case rigor, technical data fluency, and execution breadth) without changing core claims.
- Scope impact: `content/ai-context/explainers.json` (`ctx-epam.outcomes`, `ctx-epam.skillsDemonstrated`).

- Agent role: Content Strategist
- Decision: Added data-analysis and SQL/database framing to Modus and Acision explainers at execution/approach/skills levels.
- Rationale: Reflect user-confirmed cross-role data fluency and prevent database/SQL capability from appearing isolated to early engineering experience.
- Scope impact: `content/ai-context/explainers.json` (`ctx-modus-create.execution`, `ctx-modus-create.skillsDemonstrated`, `ctx-acision.approach`, `ctx-acision.execution`, `ctx-acision.skillsDemonstrated`).

- Agent role: Content Strategist
- Decision: Replaced the hero `Current focus` line with broader strategic-leadership positioning centered on AI, enterprise transformation, and business outcomes, removing developer-experience emphasis.
- Rationale: The latest role and AI-context evidence supports portfolio-level transformation and strategic leadership more strongly than DevEx specialization, which better matches senior/staff PM to director positioning.
- Scope impact: `components/home-page-shell.tsx`.

### 2026-03-14

- Agent role: Experience Designer
- Decision: Renamed system-facing product copy from `Living Resume` to `Career Twin` while explicitly leaving the hero positioned around Dmitry rather than the product.
- Rationale: The hero is personal positioning, not product taxonomy; the system surfaces needed a name that better matches the current fit-analysis and interactive-profile behavior.
- Scope impact: `components/ask-ai-overlay.tsx`, `components/chat-shell.tsx`, `components/home-page-shell.tsx`, `components/fit-analysis-form.tsx`, `app/layout.tsx`, `docs/product/prd.md`.

- Agent role: Experience Designer
- Decision: Tightened Ask AI overlay behavior so chat stays answer-only, type-ready, and product-directed: no visible proof rows, typing-dots loading state, focus retained in the composer, and fit-check requests handed off into the dedicated analysis flow through explicit assistant actions.
- Rationale: The overlay is now a lightweight interaction surface, not the place to perform the full fit workflow. The user should not need extra clicks or system-explainer responses to continue.
- Scope impact: `components/ask-ai-overlay.tsx`, `components/home-page-shell.tsx`, `components/fit-analysis-form.tsx`, `lib/chat-format.ts`, `lib/chat-handoff.ts`, `docs/product/prd.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`.

- Agent role: AI Systems Architect
- Decision: Treated `how this system/site/product is built` questions as build-process questions about the Career Twin product itself and required build answers to end with a short GitHub/source-doc suggestion.
- Rationale: Users asking how the system is built are asking about the product architecture and implementation, not generic website trivia. The GitHub pointer makes the answer operationally useful.
- Scope impact: `lib/ai/prompting.ts`, `tests/prompting.test.ts`, `docs/product/prd.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`.

- Agent role: AI Systems Architect
- Decision: Added output finalization for chat answers so visible build responses strip raw `Evidence N` markers, normalize stale `Living Resume` naming to `Career Twin`, and always preserve the GitHub/source-doc pointer once the request is routed to build-process mode.
- Rationale: Prompt-only control was not strong enough; the model kept leaking internal evidence-style formatting and legacy product naming into the visible UI.
- Scope impact: `lib/ai/prompting.ts`, `lib/ai/openai.ts`, `lib/ai/chat-service.ts`, `tests/prompting.test.ts`, `tests/chat-service.test.ts`, `docs/product/prd.md`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`.

- Agent role: Experience Designer
- Decision: Render assistant URLs in the Ask AI overlay as clickable links rather than inert plain text.
- Rationale: Build/process answers now intentionally direct users to GitHub and source documentation; that guidance is weaker if the URL cannot be used directly from the chat response.
- Scope impact: `components/ask-ai-overlay.tsx`, `tests/ask-ai-overlay.test.ts`, `docs/product/prd.md`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`.

- Agent role: Experience Designer
- Decision: Keep sentence-ending punctuation outside assistant URL anchors in the Ask AI overlay.
- Rationale: If trailing punctuation is absorbed into the clickable target, GitHub/source-doc links break at the exact point where users are most likely to click them.
- Scope impact: `components/ask-ai-overlay.tsx`, `tests/ask-ai-overlay.test.ts`, `docs/product/prd.md`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.
