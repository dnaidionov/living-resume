# AI System

## Modes

- Resume QA
- Fit analysis
- Build / process QA

## Guardrails

- Use curated repo content only for self-claims.
- Keep JD, file-upload, and page-fetch inputs ephemeral.
- Show citations for substantive answers and fit analyses.
- Distinguish proven evidence from adjacent or unsupported evidence.
- Fall back gracefully when the LLM is unavailable.

## Runtime approach

The current repo uses a portable stateless AI runtime:

- `lib/content` provides repo-managed source content.
- `lib/retrieval` prefers bundled semantic embeddings and falls back to live semantic indexing or deterministic ranking only when needed.
- `lib/ai/openai.ts` calls OpenAI through plain `fetch`, not a provider SDK.
- `lib/ai/chat-service.ts` retrieves evidence and sends the latest chat turn plus a short history window to the model.
- `lib/ai/fit-analysis.ts` retrieves evidence and requests a structured fit evaluation from the model.
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
- Requirement extraction is now its own stage and should return structured role requirements before final fit analysis is generated.
- Heuristic requirement extraction remains only as a fallback path when the LLM extractor is unavailable.
- Retrieval should run per requirement using semantic embeddings when available, while still staying repo-backed and stateless.
- Fit-analysis metadata should expose stage versions so QA can tell which extractor, retrieval path, and generator produced a result.
- Fit analysis should gate clearly non-product roles to a negative outcome even when some tool or domain overlap exists.
- Positive recruiter-fit bullets should use one defensible evidence source per bullet. If a distinct proof point is not available, that bullet should be dropped rather than reusing earlier evidence.
- Modern LLM requirements must be validated against recency; older AI/ML or chatbot work is adjacent, not direct proof.
- Technology matches must respect context, distinguishing product-adjacent familiarity from hands-on engineering ownership.
- Recruiter-facing evidence text must use explicit employer provenance from structured experience metadata, not infer the company from AI-context headlines or project-context titles.
- Negative recruiter briefs should render 3 to 5 `Where I don't fit` bullets, each explaining the concrete mismatch or missing qualification rather than using generic rejection language.
- Negative recruiter briefs should collapse repeated mismatch explanations to `Same as above.` and reject requirement-to-gap mismatches before rendering.
- `What does transfer` should describe transferable capabilities, not prior role titles or company names, while the supporting sentence should use explicit employer provenance only when that provenance exists.
- Requirement ranking should prefer concrete responsibilities, requirements, and expectations over company-branding or mission-intro prose.
- Requirement extraction must sanitize encoded artifacts such as numeric HTML entities before the segment can become a recruiter-facing bullet title.
- Evidence ranking should require meaningful keyword/domain coverage for specific requirements such as enterprise systems, integration, rollout, and technical tradeoffs; generic PM evidence is not enough on its own.
- When recruiter-visible evidence comes from an anonymized portfolio summary, the formatter should rewrite it into a portfolio-of-engagements statement with concrete project examples rather than exposing internal anonymization language.
- When multiple evidence candidates are comparably relevant, newer experience should be preferred over older experience, using structured role/project dates as a secondary ranking signal rather than overriding stronger relevance.
- Recruiter-facing fit evidence should come from actual experience-bearing sources only. In this repo, that means `resume` and `ai_context`; portfolio/meta project artifacts should not appear as proof of prior role fit.

## Session model

- Server routes stay stateless.
- Client chat history is persisted in `localStorage` and a short trailing window is sent with each chat request.
- Resume chat and fit analysis do not persist user data server-side.

## Response formatting

- Chat responses are returned as direct answers only.
- The assistant should not prepend rationale intros like "Based on..." in the visible answer body.
- The assistant should not echo the user's question in the answer output.
- Recruiter-facing fit output must not mention Dmitry's preferred domains, missing AI wording, or internal scoring logic.
