# Deployment: Cloudflare + AI Providers

## Goal

Keep the site cheap, stateless, and portable while supporting grounded resume chat, LLM fit analysis, and document/page ingestion.

## Hosting

- Cloudflare Pages for app hosting
- Cloudflare Workers for runtime endpoints
- same Next.js app can also be deployed to Vercel for side-by-side evaluation
- Cloudflare worker bundle is generated through `@opennextjs/cloudflare` into `.open-next/`

## AI

- `gpt-5-mini` is the current default baseline for grounded chat and fit-analysis generation
- deterministic bundled retrieval artifacts for the current corpus
- provider-neutral task routing with plain `fetch`-based adapters so the runtime stays portable across Cloudflare and Vercel

## Ingestion

- remote webpage fetching and text extraction in `lib/platform/url-intake.ts`
- TXT / PDF / DOCX parsing in `lib/platform/file-intake.ts`
- keep parsing stateless and request-scoped

## Logging and analytics

- Cloudflare Workers Logs for runtime logs
- Cloudflare Web Analytics for site analytics
- Google Analytics can be enabled in parallel by setting `NEXT_PUBLIC_GA_MEASUREMENT_ID`; the root layout injects the `gtag.js` snippet once and forwards the app's custom analytics events into GA
- fit-analysis analytics forwarded to GA now include `timestamp`, `input_method`, `company`, `role`, `fit_verdict`, `response_time_ms`, and `response_time_bucket`, plus `submitted_url` when the recruiter used URL mode
- chat analytics forwarded to GA include overlay open/start/prompt/response/handoff/close/error events with normalized topics and timing/session buckets, but no raw recruiter message text or assistant response content
- recruiter CTA analytics forwarded to GA include GitHub clicks, LinkedIn clicks, and resume downloads by surface
- logs should never include raw job-description or uploaded document content
- successful fit-analysis requests log structured metadata such as source URL, extracted role/company, and fit verdict so downstream notification hooks can be added without storing raw JD content

## Build pipeline

- `npm run build` runs embeddings verification, live URL regression gates, and then the standard Next.js production build
- `npm run cf:build` runs the same embeddings/url gates before generating the Cloudflare worker bundle and assets through OpenNext
- `npm run cf:deploy` now acts as a deployment preflight plus deploy wrapper:
  - loads local env
  - prints the exact Cloudflare env configuration it expects to deploy
  - fails if required secrets or env values are missing
  - refuses to continue until rerun with `--confirm-env`
- `wrangler.jsonc` targets `.open-next/worker.js` with `.open-next/assets` bound as static assets
- `open-next.config.ts` keeps the Cloudflare adapter contract explicit in-repo

## Why this stack

- near-zero static hosting cost
- low fixed runtime cost with Workers Paid when needed
- no database required for the current product shape
- portable enough to compare Cloudflare and Vercel without rewriting the app
