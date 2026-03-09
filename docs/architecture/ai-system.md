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
- `lib/retrieval` ranks static evidence from bundled artifacts.
- `lib/ai/openai.ts` calls OpenAI through plain `fetch`, not a provider SDK.
- `lib/ai/chat-service.ts` retrieves evidence and sends the latest chat turn plus a short history window to the model.
- `lib/ai/fit-analysis.ts` retrieves evidence and requests a structured fit evaluation from the model.
- `lib/platform/file-intake.ts` parses TXT, PDF, and DOCX uploads.
- `lib/platform/url-intake.ts` normalizes remote job pages into plain text.

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

## Session model

- Server routes stay stateless.
- Client chat history is persisted in `localStorage` and a short trailing window is sent with each chat request.
- Resume chat and fit analysis do not persist user data server-side.

## Response formatting

- Chat responses are returned as direct answers only.
- The assistant should not prepend rationale intros like "Based on..." in the visible answer body.
- The assistant should not echo the user's question in the answer output.
- Recruiter-facing fit output must not mention Dmitry's preferred domains, missing AI wording, or internal scoring logic.
