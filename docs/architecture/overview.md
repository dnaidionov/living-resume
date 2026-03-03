# Architecture Overview

## Summary

The MVP uses a portable architecture:

- Next.js App Router for the frontend and API routes
- Cloudflare Pages + Workers as the target deployment model
- OpenAI behind a provider abstraction
- Repo-managed content and static retrieval artifacts

## Design principles

- Keep content as the source of truth.
- Keep provider-specific logic behind interfaces.
- Keep platform-specific logic isolated.
- Keep the first release cheap without blocking future migration to Postgres.

## Main modules

- `lib/content`: file-backed content loading and normalization
- `lib/retrieval`: static retrieval and similarity ranking
- `lib/ai`: prompting, chat, fit analysis, provider wrappers
- `lib/platform`: URL and file ingestion boundaries
- `app/api/*`: thin API surfaces
