# AI System

## Modes

- Resume QA
- Fit analysis
- Build / process QA

## Guardrails

- Use curated repo content only for self-claims.
- Keep JD, file-upload, and page-fetch inputs ephemeral.
- Show citations for fit analyses and keep chat answers grounded internally, but the resume-chat overlay should display only the answer text rather than visible source/proof lines.
- Distinguish proven evidence from adjacent or unsupported evidence.
- Fall back gracefully when the LLM is unavailable.

## Runtime approach

The current repo uses a portable stateless AI runtime:

- `lib/content` provides repo-managed source content.
- `lib/retrieval` prefers bundled semantic embeddings and falls back to live semantic indexing or deterministic ranking only when needed.
- `lib/ai/openai.ts` calls OpenAI through plain `fetch`, not a provider SDK.
- `lib/ai/chat-service.ts` retrieves evidence and sends the latest chat turn plus a short history window to the model.
- `lib/ai/fit-analysis.ts` extracts requirements, resolves evidence from a broad role query plus prioritized per-requirement queries, and then requests fit synthesis from the model.
- URL fit analysis must run on fetched JD content while preserving `inputKind: "url"` in the result metadata; the raw URL should be treated as provenance only, not as analysis text.
- `lib/platform/file-intake.ts` parses TXT, PDF, and DOCX uploads.
- `lib/platform/url-intake.ts` normalizes remote job pages into plain text.
- URL intake should isolate main-content sections and strip navigation, legal, and application boilerplate before requirement extraction runs.
- URL intake should prefer structured job payloads embedded in JSON or JSON-LD when available, and it must reject serialized theme/config blobs that are not recruiter-readable role content.
- When structured or HTML body extraction is sparse, URL intake may fall back to meta/title text rather than failing immediately, but it should emit a JS-rendered-page error when the page shell still does not contain enough recruiter-readable role content.
- Local regression fixtures should cover positive non-AI roles, positive AI-native roles, and obvious stretch roles so fit-calibration drift is visible without live model calls.
- `lib/ai/requirement-extraction.ts` extracts recruiter-relevant role requirements before fit scoring, using the LLM as the primary path and heuristics only as fallback.

This keeps the app deployable on both Cloudflare and Vercel without requiring a database or server-side session store.

## Fit-analysis policy

- The evaluator is qualification-first, not ideal-role-first.
- Core product fit, execution scope, and cross-functional leadership should outweigh secondary context alignment in the overall score.
- The dimension contract is:
  - `core_match`
  - `execution_scope`
  - `leadership_collaboration`
  - `context_readiness`
- `context_readiness` should remain secondary unless the JD makes domain or technical context a true requirement.
- A JD that does not mention AI should not be treated as lower fit for that reason alone.
- The API retains an internal scorecard for calibration and testing, but the primary recruiter-facing presentation is a verdict-driven brief.
- Presentation mode can switch between `recruiter_brief` and `scorecard` for experiments without changing the evaluator core.
- Recruiter-brief evidence bullets are deterministic. The LLM may contribute verdict calibration, internal scorecard synthesis, and recommendation text, but `whereIMatch`, `gapsToNote`, `whereIDontFit`, and `whatDoesTransfer` must be assembled from deterministic requirement/evidence selection.
- Requirement extraction is now its own stage and should return structured role requirements before final fit analysis is generated.
- Heuristic requirement extraction remains only as a fallback path when the LLM extractor is unavailable.
- Retrieval now resolves fit-analysis evidence from a broad role-text query plus prioritized per-requirement queries, using semantic embeddings when available while staying repo-backed and stateless.
- Recruiter-facing `Where I match` output should be selected after ranking the broader candidate pool; render only the strongest 3 to 5 bullets with the clearest senior-signal support instead of the first few passing matches.
- Fit-analysis metadata should expose stage versions so QA can tell which extractor, retrieval path, and generator produced a result.
- Fit analysis should gate clearly non-product roles to a negative outcome even when some tool or domain overlap exists.
- Positive recruiter-fit bullets should use one defensible evidence source per bullet. If a distinct proof point is not available, that bullet should be dropped rather than reusing earlier evidence.
- When multiple positive-fit requirements are supported by the same explanation, recruiter-facing output should group those requirements under one shared evidence block instead of repeating near-identical cards.
- Modern LLM requirements must be validated against recency; older AI/ML or chatbot work is adjacent, not direct proof.
- Technology matches must respect context, distinguishing product-adjacent familiarity from hands-on engineering ownership.
- Recruiter-facing evidence text must use explicit employer provenance from structured experience metadata, not infer the company from AI-context headlines or project-context titles.
- Negative recruiter briefs should render 3 to 5 `Where I don't fit` bullets, each explaining the concrete mismatch or missing qualification rather than using generic rejection language.
- Negative recruiter briefs should collapse repeated mismatch explanations to `Same as above.` and reject requirement-to-gap mismatches before rendering.
- `What does transfer` should describe transferable capabilities, not prior role titles or company names, while the supporting sentence should use explicit employer provenance only when that provenance exists.
- Requirement ranking should prefer concrete responsibilities, requirements, and expectations over company-branding or mission-intro prose.
- Requirement ranking should also exclude culture/work-environment statements unless they contain a concrete role responsibility or qualification signal.
- Requirement extraction must sanitize encoded artifacts such as numeric HTML entities before the segment can become a recruiter-facing bullet title.
- Evidence ranking should require meaningful keyword/domain coverage for specific requirements such as enterprise systems, integration, rollout, and technical tradeoffs; generic PM evidence is not enough on its own.
- Leadership, player-coach, team-building, and product-process requirements should prefer management/process/operating evidence over isolated technical workflow examples.
- For leadership/team/process requirements, explicit management/process evidence and management-titled roles should outrank outcome-heavy product/project evidence when both are otherwise relevant.
- Direct people-management requirements should only appear in `Where I match` when the selected evidence proves direct team management or mentoring; adjacent senior-product leadership without that proof should move into `Gaps to note` instead.
- When recruiter-visible evidence comes from an anonymized portfolio summary, the formatter should rewrite it into a portfolio-of-engagements statement with concrete project examples rather than exposing internal anonymization language.
- Broad catch-all consulting evidence should remain available, but when all else is equal it should lose to more concrete project or role evidence. In this repo, Vingis is treated that way in ranking.
- When catch-all consulting evidence such as Vingis is selected anyway, recruiter-facing support text should still avoid naming it directly and fall back to a neutral `In my previous roles...` phrasing.
- For generic product-management expectations, recruiter-facing evidence should prefer the latest relevant named product role when available; otherwise it should fall back to a neutral `In my previous roles...` sentence rather than naming Vingis.
- When strong generic PM evidence is shared across multiple grouped requirements, recruiter-facing evidence should prefer a recent dual-role summary such as `EPAM and Modus Create` over a single-role `latest role` sentence when both roles are available.
- Broad senior-product qualification requirements should use a cross-role leadership summary rather than a narrow one-off explainer when the JD is asking for tenure plus generic PM leadership depth.
- Strategic-execution requirements should prefer explicit strategy/discovery/roadmap evidence over outcome-heavy delivery examples when both are available.
- When multiple evidence candidates are comparably relevant, newer experience should be preferred over older experience, using structured role/project dates as a secondary ranking signal rather than overriding stronger relevance.
- Recruiter-facing fit evidence should come from actual experience-bearing sources only. In this repo, that means `resume` and `ai_context`; portfolio/meta project artifacts should not appear as proof of prior role fit.

## Session model

- Server routes stay stateless.
- Client chat history is persisted in `localStorage` and a short trailing window is sent with each chat request.
- Resume chat and fit analysis do not persist user data server-side.
- The Ask AI overlay should keep the composer focused while it remains open so interaction stays type-ready without extra clicks.
- The Ask AI overlay should anchor its scroll rail to the bottom so starter prompts and early messages appear near the composer, with new messages pushing the thread upward while auto-scrolling to the latest turn.

## Response formatting

- Chat responses are returned as direct answers only.
- The assistant should not prepend rationale intros like "Based on..." in the visible answer body.
- The assistant should not echo the user's question in the answer output.
- The resume-chat overlay should not render citations or evidence lists under assistant messages.
- Visible chat answers should strip raw inline evidence markers such as `Evidence 1` / `Evidence 2` even if the model emits them.
- The resume-chat overlay should use a compact typing-dots indicator instead of a loading bubble.
- Assistant-rendered URLs in the chat overlay should render as clickable links rather than inert plain text.
- Trailing punctuation adjacent to assistant-rendered URLs should remain outside the anchor so links do not break.
- Fit-analysis result metadata should carry a defensively extracted target summary so the UI can show the checked role/company above the analysis body.
- URL ingestion should resolve the checked role/company label in this precedence order: provider-specific structured payloads (for example JSON-LD or ATS fields), page metadata/title, URL-derived company identity, then JD-text heuristics only as the final fallback.
- When structured/meta title and recruiter-readable JD title disagree, the displayed role title should prefer the recruiter-readable JD title while still keeping company identity from the strongest structured/meta/URL source available.
- Resume-fit requests raised inside chat should hand off into the dedicated fit-analysis workflow rather than being answered as chat responses.
- The fit-check handoff should offer explicit `Sure, let's go` and `No, stay here` actions, with the decline path handled locally rather than via an LLM round trip.
- Build/process questions such as `how this is built` should be interpreted as questions about the Career Twin product itself, and build answers should end with a short GitHub/source-doc pointer.
- Build/process answer finalization should normalize stale visible `Living Resume` references to `Career Twin` so retrieved legacy source labels do not leak into the UI.
- Recruiter-facing fit output must not mention Dmitry's preferred domains, missing AI wording, or internal scoring logic.
