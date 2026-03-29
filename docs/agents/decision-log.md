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

- Agent role: Application Engineer
- Decision: Harden uploaded fit-analysis documents so `TXT`, `PDF`, and `DOCX` uploads fail with a `400` when the file is readable but requirement extraction yields no defensible job requirements.
- Rationale: Parsing a document into text is not enough to justify recruiter-facing fit output. Benefits pages, handbooks, and other non-JD files were otherwise able to flow into analysis despite not expressing actual hiring requirements.
- Scope impact: `app/api/fit-analysis/file/route.ts`, `lib/ai/fit-analysis.ts`, `tests/platform-intake.test.ts`, `docs/product/prd.md`, `docs/qa/test-plan.md`, `docs/agents/decision-log.md`.

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

- Agent role: Application Engineer
- Decision: Carry an extracted fit-analysis target summary in result metadata and render it above the analysis output as `Role - Company` when the JD exposes that label clearly enough.
- Rationale: Users need to confirm which posting is being analyzed without re-reading the input field; this is presentation metadata, not part of the verdict itself, so it should be extracted once and carried through the result payload.
- Scope impact: `types/ai.ts`, `lib/ai/fit-analysis.ts`, `lib/ai/openai.ts`, `lib/ai/prompting.ts`, `components/fit-analysis-form.tsx`, `tests/fit-analysis-target.test.ts`, `tests/copy.test.ts`, `docs/product/prd.md`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: Ops / Release Agent
- Decision: Deployment now uses a deploy-only external URL eval gate that skips broken or drifted JD test URLs unless every required external URL case fails; the full strict URL eval suite remains unchanged for regular testing.
- Rationale: Third-party job-board pages change over time, so known external drift should not block release deployment after it has already been surfaced by normal testing, but a total outage across all required external URL cases still indicates a release-risking problem.
- Scope impact: `package.json`, `scripts/verify-deploy-url-evals.ts`, `lib/deploy/url-eval-policy.ts`, `tests/deploy-url-eval-policy.test.ts`, `docs/operations/runbook.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: AI Systems Architect
- Decision: Move URL title/company extraction to the ingestion layer, prefer structured metadata there, and treat JD-text heuristics only as backup. Expand the live URL fixture contract so parsed-JD expectations and displayed target-summary expectations can differ when an ATS exposes inconsistent metadata vs body copy.
- Rationale: The fit-result header is not a synthesis problem; it should come from the best available structured source. Some live ATS pages expose one title in structured metadata and another in the rendered body, so the regression harness must model both rather than forcing a false equivalence.
- Decision: The checked role/company label now resolves in this source order: provider-specific structured payloads, page metadata/title, URL-derived company identity, and only then JD-text heuristics.
- Decision: When a live ATS page exposes a stale or conflicting metadata title, the displayed fit-check title should prefer the recruiter-readable JD title while keeping company identity from the stronger structured/meta/URL source.
- Scope impact: `types/ai.ts`, `lib/platform/url-intake.ts`, `app/api/fit-analysis/route.ts`, `lib/ai/fit-analysis.ts`, `tests/platform-intake.test.ts`, `tests/url-fit-analysis.eval.test.ts`, `tests/fixtures/url-fit-analysis-cases.json`, `docs/product/prd.md`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

### 2026-03-16

- Agent role: AI Systems Architect
- Decision: Keep the current fit-analysis quality-oriented pipeline but remove avoidable upstream latency by batching semantic retrieval query embeddings, caching repeated URL-ingestion results by exact URL, and caching exact-input requirement extraction by normalized JD text.
- Rationale: The slow path was dominated by repeated remote round trips, not by deterministic scoring itself. Removing requirement extraction or per-requirement retrieval would have been faster but would have weakened evidence quality; batching and caching preserve the current evaluator behavior while cutting redundant fetch and model calls.
- Scope impact: `types/contracts.ts`, `lib/retrieval/store.ts`, `lib/ai/fit-analysis.ts`, `lib/ai/requirement-extraction.ts`, `lib/platform/url-intake.ts`, `tests/retrieval.test.ts`, `tests/requirement-extraction.test.ts`, `tests/platform-intake.test.ts`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: AI Systems Architect
- Decision: Add a repo-managed fit-analysis benchmark harness and standardize model experiments on per-command overrides of `OPENAI_REQUIREMENTS_MODEL` and `OPENAI_FIT_MODEL` rather than editing `.env.local`.
- Rationale: The live benchmark showed that URL fetch and batched retrieval are already small compared with model latency. A reproducible one-process benchmark is needed so model experiments can be compared honestly with caches visible and without contaminating the baseline config.
- Decision: Current live timings on the Sourgum Ashby posting show URL fetch in the hundreds of milliseconds, first-run requirement extraction at roughly 17 seconds, live batched evidence resolution under 1 second, first-run URL fit analysis at roughly 50 seconds, warm URL reruns at roughly 26 seconds, first-run pasted-text analysis at roughly 46 seconds, and warm pasted-text reruns at roughly 32 seconds.
- Rationale: Those numbers show the remaining dominant bottleneck is the final fit-synthesis model call, not retrieval or URL ingestion.
- Decision: Do not change the default fit-analysis models to `gpt-5-nano` based on speed assumptions alone. Preliminary live experiments on the Sourgum JD showed no reliable latency win and produced a more generic recruiter-brief requirement set when `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano` was used.
- Rationale: The faster-model hypothesis was weaker than it looked. In this setup, the observed latency variance and output simplification outweighed the hoped-for speed gain, so switching defaults now would be cargo-cult optimization rather than evidence-based tuning.
- Scope impact: `scripts/benchmark-fit-analysis.ts`, `package.json`, `tests/fit-benchmark-script.test.ts`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/operations/runbook.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: Application Engineer
- Decision: Replaced `alignSelf`-based Ask AI turn positioning with explicit full-width turn rows so user messages remain right-aligned and assistant messages remain left-aligned after bottom-anchoring the chat rail.
- Rationale: The bottom-anchoring refactor changed the rail to a flex column, which made `justifySelf`/implicit alignment behavior too weak and caused user turns to collapse to the assistant side. Explicit row-level justification is the more stable layout contract.
- Scope impact: `components/ask-ai-overlay.tsx`, `tests/ask-ai-overlay.test.ts`, `docs/product/prd.md`, `docs/architecture/ai-system.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: QA / Evaluations Agent
- Decision: Added a fixture-driven live URL-ingestion and fit-analysis regression gate using repo-managed external job URLs, and made the enabled required cases part of the build path.
- Rationale: Synthetic HTML fixtures were not enough to catch provider-specific regressions. The required ATS pages now need direct coverage so URL-ingestion failures are caught before release, even though this intentionally adds third-party availability risk to the build.
- Scope impact: `tests/fixtures/url-fit-analysis-cases.json`, `tests/url-fit-analysis.eval.test.ts`, `lib/platform/url-intake.ts`, `package.json`, `docs/product/prd.md`, `docs/qa/test-plan.md`, `docs/operations/runbook.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: AI Systems Architect
- Decision: Replace the OpenAI-only runtime assumption with task-routed provider-neutral config, using built-in OpenAI/OpenRouter presets plus custom OpenAI-compatible providers via namespaced env vars.
- Rationale: Model experiments should not require vendor-specific rewrites or global provider switches. Chat, fit, requirement extraction, and embeddings need to be independently routable while preserving the current repo behavior as the fallback path.
- Scope impact: `lib/ai/provider-config.ts`, `lib/ai/providers/openai-compatible.ts`, `lib/ai/openai.ts`, `lib/ai/requirement-extraction.ts`, `lib/retrieval/store.ts`, `scripts/benchmark-fit-analysis.ts`, `scripts/build-embeddings.ts`, `.env.example`, `docs/architecture/ai-system.md`, `docs/operations/runbook.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`.

- Agent role: AI Systems Architect
- Decision: Use task-specific OpenRouter free-model recommendations rather than a single global free-model switch.
- Rationale: The benchmark evidence did not support a universal migration. `qwen/qwen3-next-80b-a3b-instruct:free` performed well for requirement extraction and, in the broader zero-price follow-up, became the fastest acceptable fit model; `openai/gpt-oss-120b:free` remained a conservative fallback; `stepfun/step-3.5-flash:free` was too unstable for fit; the tested free chat candidates failed in the current runtime; and `nvidia/llama-nemotron-embed-vl-1b-v2:free` became a viable free embedding candidate once the scope widened beyond the curated collection page.
- Scope impact: `docs/qa/fit-analysis-benchmark-2026-03-17.md`, `docs/architecture/ai-system.md`, `docs/operations/runbook.md`, `docs/qa/test-plan.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: AI Systems Architect
- Decision: Widen OpenRouter candidate discovery from the curated free-model collection page to the broader zero-price model index at `https://openrouter.ai/models?max_price=0`, while keeping the actual benchmark plan shortlist-based.
- Rationale: The collection page was not complete enough to support a credible recommendation, particularly for embeddings. The broader zero-price index is the better source of scope, but benchmarking every zero-price model would create noise and weaken the experimental design.
- Scope impact: `docs/qa/fit-analysis-benchmark-2026-03-17.md`, `docs/operations/runbook.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: AI Systems Architect
- Decision: Reconcile the OpenRouter benchmark recommendation after the stricter no-cache parallel pass to keep `openai/gpt-oss-120b:free` as the default free model for both `fit` and `requirements`, keep `gpt-5-mini` for `chat`, and keep `text-embedding-3-small` for `embeddings`.
- Rationale: The final no-cache evidence showed `qwen/qwen3-next-80b-a3b-instruct:free` is still the fastest completed fit path, but it is consistently more generic than `gpt-oss-120b:free`. The embeddings candidate remained promising but was not benchmarked cleanly enough in the final pass to justify changing the default.
- Scope impact: `docs/qa/fit-analysis-benchmark-2026-03-17.md`, `docs/architecture/ai-system.md`, `docs/operations/runbook.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: Ops / Release Agent
- Decision: Make Cloudflare deployment env-aware by routing `npm run cf:deploy` through a preflight that prints the exact AI env configuration, blocks on missing required values, and requires explicit `--confirm-env` acknowledgement before deploy.
- Rationale: With provider-neutral routing, Cloudflare deployment is no longer just code plus one API key. Silent env drift is now a real release risk, so deployment must surface the effective task/provider/model configuration and force operator confirmation instead of assuming it.
- Scope impact: `lib/deploy/cloudflare-env.ts`, `scripts/cf-deploy.ts`, `package.json`, `tests/cf-deploy-script.test.ts`, `docs/product/prd.md`, `docs/architecture/deployment-cloudflare-openai.md`, `docs/operations/runbook.md`, `docs/decisions/0008-stateless-llm-runtime.md`, `docs/agents/handoffs.md`, `docs/agents/decision-log.md`.

- Agent role: Product Architect / AI Systems Architect / Ops / Release Agent
- Decision: Resync the product, architecture, and operations docs to the shipped one-page IA, provider-neutral runtime, and gated build pipeline; renumber the stateless runtime ADR to `0008` so ADR identifiers remain unique.
- Rationale: The repo had drifted into an internally inconsistent state: the PRD still described a chat-first homepage, the runbook still assumed visible chat citations and an OpenAI-only release secret, the architecture overview understated retrieval/runtime behavior, and the duplicated `0005` ADR number made the decision history ambiguous.
- Scope impact: `README.md`, `docs/product/prd.md`, `docs/architecture/overview.md`, `docs/architecture/deployment-cloudflare-openai.md`, `docs/operations/runbook.md`, `docs/decisions/0008-stateless-llm-runtime.md`, `docs/agents/decision-log.md`.

- Agent role: Ops / Release Agent / Application Engineer
- Decision: Add Google Analytics as an optional root-layout integration behind `NEXT_PUBLIC_GA_MEASUREMENT_ID`, and reuse the existing `living-resume:analytics` browser event boundary to forward product events into `gtag`.
- Rationale: The app already had an internal analytics contract. Bridging that contract into GA keeps vendor-specific code centralized, preserves the existing event model, and makes GA opt-in per environment rather than hardwired into feature code.
- Scope impact: `app/layout.tsx`, `components/google-analytics.tsx`, `.env.example`, `tests/google-analytics.test.ts`, `docs/architecture/deployment-cloudflare-openai.md`, `docs/operations/runbook.md`, `docs/agents/decision-log.md`.

- Agent role: Ops / Release Agent / Application Engineer
- Decision: Enrich fit-analysis analytics events with recruiter-action metadata: `timestamp`, `input_method`, `company`, `role`, and `fit_verdict`, plus `submitted_url` when URL mode is used.
- Rationale: This preserves the no-raw-JD privacy boundary while making recruiter activity materially observable in Google Analytics. The event payload now supports usage tracking and downstream notification logic without exporting pasted job text or uploaded document contents.
- Scope impact: `lib/analytics/fit-analysis.ts`, `components/fit-analysis-form.tsx`, `tests/fit-analysis-analytics.test.ts`, `docs/architecture/deployment-cloudflare-openai.md`, `docs/operations/runbook.md`, `docs/agents/decision-log.md`.

- Agent role: Ops / Release Agent / Application Engineer
- Decision: Expand analytics coverage to include normalized chat lifecycle events, recruiter CTA clicks, and fit-analysis response timing while continuing to exclude raw user-entered text and uploaded content from GA payloads.
- Rationale: Basic pageview analytics are not enough to understand whether the product works. The useful signals are chat entry points, topic categories, handoff conversion, response latency, GitHub/LinkedIn/resume CTA clicks, and fit-analysis turnaround time. Sending raw transcript or JD content would create privacy noise without improving product insight.
- Scope impact: `lib/analytics/chat.ts`, `lib/analytics/events.ts`, `lib/analytics/fit-analysis.ts`, `components/ask-ai-overlay.tsx`, `components/home-page-shell.tsx`, `components/hero.tsx`, `components/site-header.tsx`, `components/fit-analysis-form.tsx`, `tests/chat-analytics.test.ts`, `tests/click-analytics.test.ts`, `tests/fit-analysis-analytics.test.ts`, `docs/architecture/deployment-cloudflare-openai.md`, `docs/operations/runbook.md`, `docs/agents/decision-log.md`.
