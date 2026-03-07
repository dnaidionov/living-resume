# Deployment: Cloudflare + OpenAI

## Goal

Keep the site cheap, stateless, and portable while supporting grounded resume chat, LLM fit analysis, and document/page ingestion.

## Hosting

- Cloudflare Pages for app hosting
- Cloudflare Workers for runtime endpoints
- same Next.js app can also be deployed to Vercel for side-by-side evaluation

## AI

- `gpt-5-mini` for grounded chat and fit-analysis generation
- deterministic bundled retrieval artifacts for the current corpus
- plain `fetch` calls to OpenAI so the runtime stays portable across Cloudflare and Vercel

## Ingestion

- remote webpage fetching and text extraction in `lib/platform/url-intake.ts`
- TXT / PDF / DOCX parsing in `lib/platform/file-intake.ts`
- keep parsing stateless and request-scoped

## Logging and analytics

- Cloudflare Workers Logs for runtime logs
- Cloudflare Web Analytics for site analytics
- logs should never include raw job-description or uploaded document content

## Why this stack

- near-zero static hosting cost
- low fixed runtime cost with Workers Paid when needed
- no database required for the current product shape
- portable enough to compare Cloudflare and Vercel without rewriting the app
