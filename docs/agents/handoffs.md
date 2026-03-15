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
- keep resume-chat answers grounded server-side but do not render visible citations/proof rows in the Ask AI overlay
- send resume-chat messages from the Ask AI overlay on `Cmd+Enter` (macOS) and `Ctrl+Enter` (Windows/Linux) without breaking multiline entry on plain `Enter`
- normalize Ask AI overlay message whitespace before storing/rendering so empty lines do not create oversized chat bubbles
- replace the temporary Ask AI `Thinking...` bubble with a compact animated typing-dots indicator
- intercept resume-fit requests in the Ask AI overlay and hand them off to the dedicated Role Fit section; on confirmation, close chat, prefill the matching URL/text input, scroll to the section, and auto-run the fit analysis
- render the fit-check handoff as explicit assistant actions (`Sure, do it`, `No, stay here`) instead of relying on typed confirmation; declining keeps chat open and replies `Ok, staying here.`
- keep keyboard focus in the Ask AI composer on open and after in-chat replies or handoff dismissal so the chat remains type-ready without extra clicks
- add top-menu resume download icon button with tooltip `Download classic resume`, linked to `public/classic-resume.txt` download target
- add resume download control to hero and menu; implement zero-delay attached callout label in place of native tooltip
- update menu/hero resume download targets to latest PDF (`/DmitryNaidionov-cv.pdf`) copied from user-provided source path
- apply selected file-download icon variant and remove hero download button text (icon-only with callout label)
- normalize download button style/alignment to match section-specific controls rather than standalone icon-button treatment
- fix hero download button scale/alignment mismatch by matching action-row button dimensions and stretch behavior
- remove `public/classic-resume.txt` fallback and keep PDF (`public/DmitryNaidionov-cv.pdf`) as the only download target
- correct hero download icon/text-row alignment via flex baseline tuning and icon-level centering adjustment
- style recruiter-brief fit analysis with semantic tones: electric-cyan strong-fit/match, neutral ink-white probable-fit/gaps, soft-gold non-fit, including colored verdict/recommendation panels and section-specific bullet icons
- when a fit-analysis card groups multiple matched requirements into one support block, render a checkmark beside each requirement line instead of a single outer card-level checkmark
- collapse fit-analysis form and results into a single card; show only the input block initially and insert results below it after analysis with a thin divider
- align AI Context subsection headers to the same muted uppercase caption treatment used by fit-analysis section headers

## AI Systems Architect -> Application Engineer (Stateless LLM Runtime 2026-03-07)

- replace placeholder chat and fit-analysis generation with portable OpenAI `fetch` calls
- preserve current UI response shape while allowing richer fit-analysis internals
- keep server routes stateless; store short chat history in browser `localStorage` only
- use bundled retrieval artifacts instead of request-time filesystem scanning where possible
- support TXT, PDF, and DOCX file ingestion plus remote page text extraction for fit analysis
- keep deployment compatibility across Cloudflare Pages/Workers and Vercel

## AI Systems Architect -> Application Engineer (Fit Analysis Phase 1 2026-03-09)

- add a dedicated LLM-based requirement extraction stage ahead of fit analysis
- keep heuristic requirement extraction only as fallback
- pass structured role requirements into prompt assembly and fallback recruiter-brief generation
- preserve the existing public fit-analysis response contract while upgrading evaluator internals

## AI Systems Architect -> Application Engineer (Fit Analysis Phase 2 2026-03-09)

- replace deterministic retrieval as the primary path with semantic retrieval
- keep retrieval repo-backed via `content/retrieval/embeddings.generated.json`
- allow live in-memory semantic indexing only as a fallback when the artifact is missing but `OPENAI_API_KEY` is present
- preserve a deterministic fallback path when semantic retrieval is unavailable
- require whichever agent materially changes indexed content to regenerate embeddings before release or handoff; code-only changes do not trigger an embeddings rebuild

## AI Systems Architect -> Application Engineer (Fit Analysis Phase 3 2026-03-09)

- remove canned fallback recruiter bullets wherever role-derived requirements or evidence can be used instead
- derive fallback gaps from requirement coverage rather than fixed copy
- derive fallback transfer bullets from retrieved evidence rather than generic stock phrases
- expose evaluator stage versions in fit-analysis metadata for QA and release diagnostics

## AI Systems Architect -> Application Engineer (Fit Analysis Phase 4 2026-03-09)

- strengthen URL intake so main-content sections survive and nav/legal/application chrome is removed before requirement extraction
- preserve list and heading boundaries because downstream requirement extraction depends on them
- keep the parser generic rather than ATS-vendor-specific

## AI Systems Architect -> QA / Evaluations Agent (Fit Analysis Phase 5 2026-03-09)

- add eval fixtures for non-AI product roles, AI-native roles, and clear stretch roles
- use the eval harness to catch false negatives and obvious false positives before release
- keep the harness local and deterministic so it can run in CI without live LLM calls

## AI Systems Architect -> Application Engineer / QA (Fit Validation Policy 2026-03-10)

- gate clearly non-product roles to a negative fit even when overlapping tools or domain terms exist
- collapse repeated bullet evidence to `Same as above.` / `See previous point.` instead of restating the same proof
- treat pre-2023 AI/ML or chatbot evidence as adjacent rather than direct proof for modern LLM orchestration requirements
- validate technology matches by context, distinguishing hands-on engineering ownership from adjacent product exposure
- use explicit employer provenance from structured content metadata when rendering recruiter-facing evidence text; never infer employer from AI-context headlines
- when the verdict is negative, render 3 to 5 `Where I don't fit` bullets and make each gap explanation concrete to the requirement instead of generic
- collapse repeated negative explanations to `Same as above.` and block requirement-to-gap mismatches before recruiter-facing rendering
- render `What does transfer` as transferable capabilities rather than job titles, and never use AI-context or project headlines as employer fallbacks in recruiter-facing evidence text
- when URL intake sees embedded structured job payloads, prefer them over raw HTML text, and explicitly block serialized theme/config blobs from downstream requirement extraction
- if URL intake cannot recover real body content, fall back to title/meta only as a last resort and surface a distinct JS-rendered-page error when even that is insufficient
- keep company-mission intro copy out of recruiter-facing match bullets and prefer alternative relevant evidence over reusing one chunk across unrelated positive bullets
- prefer newer dated experience when competing evidence is otherwise comparably relevant, including project evidence linked to recent parent roles
- restrict recruiter-facing fit evidence to actual experience-bearing sources; do not let portfolio/meta project artifacts surface as proof of prior role fit
- sanitize numeric HTML entities and other encoded artifacts before JD segments are promoted to recruiter-facing bullet titles
- require one-to-one positive evidence assignment: if a bullet cannot be supported by its own defensible proof point, drop it instead of showing `Same as above.`
- if multiple positive-fit requirements share the same explanation, group them into one recruiter-facing evidence block and render the requirements as bullets under that shared support text
- when handling URL fit-analysis input, preserve the original URL as provenance but pass fetched JD content through requirement extraction, retrieval, and generation so recruiter-facing output never analyzes the URL string itself
- tighten evidence ranking for enterprise/integration/rollout/tradeoff requirements so generic PM evidence does not outrank more relevant technical-operating proof
- exclude culture/work-environment statements from recruiter-facing requirement bullets unless they contain a concrete responsibility or qualification signal
- for player-coach, team-building, and operating-rhythm requirements, rank leadership/process evidence ahead of isolated implementation examples
- for leadership/team/process requirements, prefer explicit management/process evidence and management-titled roles over generic outcome-heavy product evidence when both can support the bullet
- treat direct people-management requirements as a higher bar than general senior-product leadership: if the evidence is only adjacent, move that requirement into `Gaps to note` rather than `Where I match`
- fit-analysis retrieval should merge a broad role-text query with prioritized per-requirement queries so the scorer can see enough management/process/context evidence before ranking support
- after broader recall, rank candidate requirement-evidence pairs and render only the strongest 3 to 5 recruiter-facing bullets, with a bias toward senior-signal support rather than first-match order
- use the LLM for internal fit synthesis and recommendation text only; recruiter-facing evidence bullets must come from deterministic requirement/evidence selection so model drift cannot override grounded support
- rewrite anonymized portfolio-summary evidence into concrete engagement examples such as conversational AI assistant or fleet management portal instead of exposing internal anonymization phrasing
- keep Vingis available as supporting evidence, but deprioritize it against more concrete role/project evidence when the match quality is otherwise comparable
- for generic PM expectations, prefer the latest relevant named product role in recruiter-facing evidence sentences; if only catch-all evidence like Vingis remains, keep the sentence generic instead of naming it
- when grouped generic PM bullets are supported by recent-role evidence from both EPAM and Modus Create, prefer a dual-role sentence rather than naming only the latest role
- when the JD asks for broad senior-product tenure plus generic leadership depth, use a cross-role leadership summary rather than a narrow one-off explainer as recruiter-facing support
- if catch-all consulting evidence such as Vingis is still the selected support, render it as neutral `In my previous roles...` phrasing rather than naming Vingis directly
- for strategic-execution requirements, prefer strategy/discovery/roadmap proof over outcome-only delivery examples when both can support the same JD bullet
- treat `how this system/site/product is built` chat questions as build/process questions about the Career Twin product itself, not as generic website trivia
- end build/process chat answers with a short invitation to see the source and documentation on GitHub: `https://github.com/dnaidionov/living-resume`
- strip raw `Evidence N` markers from visible chat answers before they reach the overlay
- normalize stale visible `Living Resume` phrasing to `Career Twin` in build-process answers so legacy source labels do not leak into the UI
- render assistant URLs in the Ask AI overlay as clickable links so GitHub/source-doc pointers are directly usable
- keep trailing punctuation outside assistant URL anchors so GitHub/source-doc links remain valid when a sentence ends with punctuation

## Ops / Release Agent -> Deployment Execution (Cloudflare Adapter Readiness 2026-03-07)

- local release gates now include `npm run cf:build`, not only `npm run build`
- Cloudflare deployment path is standardized on `@opennextjs/cloudflare` plus `wrangler`
- `open-next.config.ts` is required so the worker bundle can be generated deterministically in-repo
- release verification must confirm `.open-next/worker.js` and `.open-next/assets` exist before deploy
- keep Vercel as a portable fallback path if Cloudflare smoke tests fail after deployment

## Cross-agent planning intake (2026-03-10)

- Source planning artifact: `docs/agents/cross-agent-plan-2026-03-10.md`
- Content Strategist owns the requested senior-signal strengthening for EPAM, Modus, and Cardstack, including the Modus/Verizon cloud redesign addition.
- Content Strategist also owns the broader capability-coverage audit across resume and AI-context content so underrepresented qualification areas become retrievable and recruiter-visible.
- Experience Designer owns the recruiter-facing fit-result color system and chat-interaction UX review.
- AI Systems Architect owns the chat-runtime review, retrieval-coverage review, and deployed LLM latency recommendations.
- Application Engineer owns implementation after content, UX, and architecture requirements are finalized.
- QA / Evaluations Agent owns grounding, semantic-color, capability-coverage, and chat/performance regression coverage.
- Ops / Release Agent owns production monitoring and rollout guidance for latency-related changes.
