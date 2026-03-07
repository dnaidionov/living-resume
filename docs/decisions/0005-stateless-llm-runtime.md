# ADR 0005: Stateless LLM Runtime for Chat and Fit Analysis

## Decision

Use a stateless LLM runtime for resume chat and fit analysis, with repo-managed content as the source of truth and client-side chat memory persisted only in the browser.

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
- Call OpenAI through plain `fetch` so the runtime remains portable.
- Parse TXT, PDF, and DOCX files inside the app runtime.
- Normalize remote job pages into plain text at request time.
- Preserve the existing UI response contracts while upgrading internals.

## Consequences

### Positive

- No database is required for the current product scope.
- Cloudflare and Vercel can run the same codebase.
- The app can support real LLM-backed chat and fit analysis without server-side session storage.

### Negative

- Chat memory is browser-local and not shared across devices.
- Large-scale retrieval and persistent analysis history remain deferred.
- PDF and DOCX parsing quality depends on runtime-compatible libraries and should be monitored in QA.
