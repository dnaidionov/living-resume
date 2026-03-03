# Migration Path

## Add Postgres later

The app should migrate by replacing implementations, not rewriting features.

### Required invariants

- Keep `ContentStore` stable.
- Keep `RetrievalStore` stable.
- Keep provider wrappers isolated.
- Keep domain types independent from platform bindings.

## Expected future path

1. Move normalized content into Postgres.
2. Move embeddings into `pgvector`.
3. Replace static retrieval with DB-backed retrieval.
4. Keep UI and API contracts unchanged.

## Host migration

Cloudflare-specific code should remain under `lib/platform` or deployment config so the app can later move to Vercel, Railway, Fly.io, or other infrastructure with limited churn.
