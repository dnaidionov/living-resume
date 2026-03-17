# Deployment: Cloudflare + OpenAI

## Goal

Keep the site cheap, stateless, and portable while supporting grounded resume chat, LLM fit analysis, and document/page ingestion.

## Hosting

- Cloudflare Pages for app hosting
- Cloudflare Workers for runtime endpoints
- same Next.js app can also be deployed to Vercel for side-by-side evaluation
- Cloudflare worker bundle is generated through `@opennextjs/cloudflare` into `.open-next/`

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
- successful fit-analysis requests log structured metadata such as source URL, extracted role/company, and fit verdict so downstream notification hooks can be added without storing raw JD content

## Build pipeline

- `npm run build` validates the standard Next.js production build
- `npm run cf:build` generates the Cloudflare worker bundle and assets through OpenNext
- `wrangler.jsonc` targets `.open-next/worker.js` with `.open-next/assets` bound as static assets
- `open-next.config.ts` keeps the Cloudflare adapter contract explicit in-repo

## Why this stack

- near-zero static hosting cost
- low fixed runtime cost with Workers Paid when needed
- no database required for the current product shape
- portable enough to compare Cloudflare and Vercel without rewriting the app
