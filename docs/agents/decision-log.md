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

- Agent role: Content Strategist
- Decision: Strengthened EPAM AI Experience AI-context wording to explicitly capture multi-agent orchestration, Anthropic/Claude implementation details, and added `LLM Orchestration` skill while preserving requested wording constraints.
- Rationale: Improve precision and evidence depth for LLM orchestration claims in hero and role narrative alignment.
- Scope impact: `content/ai-context/explainers.json`.
