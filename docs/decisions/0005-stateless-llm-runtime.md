# ADR 0005: Stateless LLM Runtime for Chat and Fit Analysis

## Decision

Use a stateless, provider-neutral AI runtime for resume chat and fit analysis, with repo-managed content as the source of truth and client-side chat memory persisted only in the browser.

## Context

The app needs to support:

- grounded chat about Dmitry's resume and project work
- fit analysis against pasted text, uploaded files, and remote job pages
- simultaneous deployment to Cloudflare and Vercel
- low fixed cost without introducing a database or accounts

## Decision details

- Keep server routes stateless.
- Persist short chat history in browser `localStorage` only.
- Retrieve evidence from bundled repo artifacts.
- Route chat, fit synthesis, requirement extraction, and embeddings through task-specific provider config.
- Keep the first adapter OpenAI-compatible so OpenAI, OpenRouter, and custom OpenAI-compatible providers can reuse one transport.
- Parse TXT, PDF, and DOCX files inside the app runtime.
- Normalize remote job pages into plain text at request time.
- Preserve the existing UI response contracts while upgrading internals.
- Treat Cloudflare deployment as configuration-coupled: the deploy path must surface the exact routed task/provider/model env configuration and require explicit confirmation before release.

## Consequences

### Positive

- No database is required for the current product scope.
- Cloudflare and Vercel can run the same codebase.
- The app can support real LLM-backed chat and fit analysis without server-side session storage or vendor lock-in at the routing layer.
- Deployment mistakes caused by invisible environment drift become less likely because the deploy path now forces an env review step.

### Negative

- Chat memory is browser-local and not shared across devices.
- Large-scale retrieval and persistent analysis history remain deferred.
- PDF and DOCX parsing quality depends on runtime-compatible libraries and should be monitored in QA.
- Non-OpenAI-compatible providers still require new native adapters; the current generic runtime is provider-neutral at the routing layer but not protocol-universal yet.
- Cloudflare deploys are now intentionally less one-command and require an explicit `--confirm-env` acknowledgement after showing the planned env configuration.
