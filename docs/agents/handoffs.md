# Agent Handoffs

## Product Architect -> Experience Designer / Content Strategist

- recruiter-first scope
- required surfaces
- success criteria
- cost ceiling

## Content Strategist -> AI Systems Architect / Application Engineer

- stable content IDs
- role-to-explainer mapping
- source files for retrieval
- voice and candor rules

## Content Strategist -> AI Systems Architect / Application Engineer (Resume Data Pack 2026-03-05)

- replaced scaffold resume roles with production role data from approved resume content
- added project-level AI context structure via `projectContexts[]` (`situation`, `approach`, `work`, optional `lessonsLearned`)
- enforced EPAM client anonymity in stored content
- introduced intentional legacy-role AI context omission (`aiContextId` optional on condensed earlier engineering role)
- documented implementation requirements in `docs/agents/content-strategist-resume-data-pack-2026-03-05.md`

## Cross-role documentation policy

- meaningful decisions must be logged proactively without explicit prompting
- use `docs/agents/decision-log.md` for concise decision entries
- use ADRs in `docs/decisions/` when decisions affect architecture or long-lived contracts

## Experience Designer + AI Systems Architect -> Application Engineer

- UI behavior for chat, scorecard, AI context
- retrieval and citation contract
- fit-analysis output shape

## Experience Designer -> Application Engineer (Brand Palette Update)

- apply EPAM-inspired palette tokens in `app/globals.css`
- preserve accessible contrast for body copy, nav, and CTA states
- keep accent usage concentrated in eyebrows, CTA, and interaction outlines
- use dark-first foundations with cyan/purple interaction accents and lime for priority CTA emphasis
- switch priority `Ask AI` CTA treatment to cyan-violet gradient fill for stronger visual coherence
- use a compact secondary button variant for `View AI Context` and add sparkle iconography to AI-entry buttons
- increase sparkle icon scale and further reduce compact button dimensions to improve visual hierarchy in role cards
- replace modal AI Context behavior with inline expandable panels per role card; trigger uses borderless bottom-anchored control with open/close arrow state
- update role-card toggle to chevron indicators, lighten inline AI Context panel background, and reduce keyword pill scale/typography
- remove hero Reading Guide and utility pills; update hero identity copy and CTA text/icon (`Ask AI About Me` with chat icon)
- set hero title/subtitle to serif and increase hero `Ask AI About Me` CTA text weight
- add LinkedIn CTA to hero action row and switch top-menu identity from full name to serif initials
- move LinkedIn from hero action row into inline linked image treatment within hero copy text
- convert header to full-width sticky nav with scroll-triggered background lightening and bottom separator border
- align full-width sticky header inner content to same horizontal bounds as section shell

## Application Engineer -> QA / Evaluations Agent

- route behavior
- component states
- evidence expectations
- runtime assumptions

## QA / Evaluations Agent -> Ops / Release Agent

- pass/fail results
- unresolved risks
- release gates

## Diagram Artifact

- Mermaid source: `docs/agents/handoffs.mmd`
- Rendered image used in site: `public/agent-handoffs.svg`
- add repository CTA in How This Is Built section (`See it on GitHub` with GitHub icon) linking to project repo
- move GitHub repo CTA beside How This Is Built intro text with compact spacing
- replace two-column Ask AI overlay with single-column chat UI (no mode selector, no evidence column, no confidence/meta), plus starter questions and appended message history per session
- update overlay chat UX: prior title/subtitle restored, icon-only close, assistant-style starter chips, one-line-to-three-line auto-growing input, and send button anchored to the right of composer
- change send button glyph to paper-plane icon in Ask AI overlay composer
- adjust chat composer send icon centering/scale and set higher-contrast icon color for readability on accent gradient button
- switch send glyph to tilted outlined plane icon for clearer directional affordance
- refine overlay header separation and close affordance: thin header-bottom border plus larger borderless top-right close icon
- remove chat answer preambles and question echoes; return direct answer text only
- add top-menu resume download icon button with tooltip `Download classic resume`, linked to `public/classic-resume.txt` download target
- add resume download control to hero and menu; implement zero-delay attached callout label in place of native tooltip
- update menu/hero resume download targets to latest PDF (`/DmitryNaidionov-cv.pdf`) copied from user-provided source path
- apply selected file-download icon variant and remove hero download button text (icon-only with callout label)
- normalize download button style/alignment to match section-specific controls rather than standalone icon-button treatment
- fix hero download button scale/alignment mismatch by matching action-row button dimensions and stretch behavior
- remove `public/classic-resume.txt` fallback and keep PDF (`public/DmitryNaidionov-cv.pdf`) as the only download target
- correct hero download icon/text-row alignment via flex baseline tuning and icon-level centering adjustment
