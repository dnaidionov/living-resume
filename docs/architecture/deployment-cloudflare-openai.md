# Deployment: Cloudflare + OpenAI

## Goal

Keep v1 below the budget ceiling while preserving a migration path to richer infrastructure later.

## Hosting

- Cloudflare Pages for app hosting
- Cloudflare Workers for runtime endpoints

## AI

- `gpt-5-mini` for generation
- `text-embedding-3-small` for embeddings

## Logging and analytics

- Cloudflare Workers Logs for runtime logs
- Cloudflare Web Analytics for site analytics

## Why this stack

- Near-zero infra cost
- Sufficient for a public MVP
- Portable if the product later adds Postgres or moves to another host
