# Architecture Overview

## Summary

The MVP uses a portable architecture:

- Next.js App Router for the frontend and API routes
- Cloudflare Pages + Workers as the target deployment model
- provider-neutral AI routing with an OpenAI-compatible adapter layer
- repo-managed content plus bundled semantic retrieval artifacts with deterministic fallback

## Design principles

- Keep content as the source of truth.
- Keep provider-specific logic behind interfaces.
- Keep platform-specific logic isolated.
- Keep the first release cheap without blocking future migration to Postgres.

## Main modules

- `lib/content`: file-backed content loading and normalization
- `lib/retrieval`: bundled semantic retrieval with live-index and deterministic fallback paths
- `lib/ai`: prompting, chat, fit analysis, provider wrappers
- `lib/platform`: URL and file ingestion boundaries
- `app/api/*`: thin API surfaces
