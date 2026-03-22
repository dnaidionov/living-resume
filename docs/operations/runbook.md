# Runbook

## Local setup

1. Install dependencies with `npm install`.
2. Run the test suite with `npm test`.
3. Run a production build with `npm run build`.
4. Run the dev server with `npm run dev` if you need a local smoke test.

## Environment variables

- task routing:
  - `AI_CHAT_PROVIDER`
  - `AI_FIT_PROVIDER`
  - `AI_REQUIREMENTS_PROVIDER`
  - `AI_EMBEDDINGS_PROVIDER`
- task models:
  - `AI_CHAT_MODEL`
  - `AI_FIT_MODEL`
  - `AI_REQUIREMENTS_MODEL`
  - `AI_EMBEDDING_MODEL`
- built-in provider credentials:
  - `OPENAI_API_KEY`
  - `OPENAI_BASE_URL` (optional, defaults to `https://api.openai.com/v1`)
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_BASE_URL` (optional, defaults to `https://openrouter.ai/api/v1`)
  - `OPENROUTER_HTTP_REFERER` (recommended for OpenRouter)
  - `OPENROUTER_APP_TITLE` (recommended for OpenRouter)
- custom OpenAI-compatible provider credentials:
  - `AI_PROVIDER_<NAME>_COMPATIBILITY=openai`
  - `AI_PROVIDER_<NAME>_API_KEY`
  - `AI_PROVIDER_<NAME>_BASE_URL`
- legacy compatibility:
  - `OPENAI_CHAT_MODEL` still backs chat when `AI_CHAT_MODEL` is unset
  - `OPENAI_FIT_MODEL` still backs fit when `AI_FIT_MODEL` is unset
  - `OPENAI_REQUIREMENTS_MODEL` still backs requirements when `AI_REQUIREMENTS_MODEL` is unset
  - `OPENAI_EMBEDDING_MODEL` still backs embeddings when `AI_EMBEDDING_MODEL` is unset
  - if `AI_REQUIREMENTS_PROVIDER` is unset, it inherits `AI_FIT_PROVIDER` before falling back to `openai`
- UI/runtime:
  - `NEXT_PUBLIC_FIT_PRESENTATION_MODE` (`recruiter_brief` or `scorecard`, defaults to `recruiter_brief`)
- Use [`.env.example`](../../.env.example) as the starting point for local configuration.

## Semantic Retrieval Artifact

- Run `npm run embeddings:build` after materially changing resume, project, FAQ, or AI-context content.
- Do not rebuild embeddings for code-only changes such as UI work, route logic, prompt tuning, tests, deployment config, or styling when the retrieval corpus itself is unchanged.
- The rebuild trigger is a retrieval-corpus change, not a specific agent role. Any agent that materially changes indexed content is responsible for regenerating the artifact before handoff or release.
- This writes `content/retrieval/embeddings.generated.json`.
- If the artifact is missing or empty in an environment with an embeddings-capable provider configured, the app can build a live in-memory semantic index at runtime.
- If neither the artifact nor an embeddings-capable provider is available, retrieval falls back to deterministic local ranking.

## Secret handling

- Never commit API keys to the repository.
- Never place production secrets in tracked files such as `next.config.ts`, JSON config, or docs.
- For local development, use an untracked `.env.local`.
- Standalone repo scripts such as `npm run embeddings:build`, `npm run content:build`, and `npm run bench:fit` load `.env.local` automatically.
- For Cloudflare, store provider secrets in the project or Worker settings, or use `wrangler secret put <KEY_NAME>`.
- `npm run cf:deploy` now includes a deployment preflight that prints the exact Cloudflare env configuration it intends to deploy and refuses to continue until rerun with `--confirm-env`.
- For Vercel, store provider secrets in the project environment settings or via `vercel env add <KEY_NAME>`.

## Fit-analysis benchmarking

- Run `npm run bench:fit -- --url "<job-url>"` to benchmark the live fit-analysis path in one process.
- The detailed benchmark record, including methodology, comparison matrix, actual measured timings, and conclusions, lives in `docs/qa/fit-analysis-benchmark-2026-03-17.md`.
- That benchmark record now also includes the OpenRouter free-model comparison for fit, requirements, chat, and embeddings viability.
- Candidate scope for future OpenRouter benchmarking should come from the broader zero-price index `https://openrouter.ai/models?max_price=0`, not only the curated free-model collection page.
- The benchmark reports:
  - URL fetch first run vs rerun
  - requirement extraction first run vs rerun
  - evidence resolution
  - end-to-end fit analysis for URL input first run vs rerun
  - end-to-end fit analysis for pasted-text input first run vs rerun
- The benchmark also prints the active provider/model for chat, fit, requirements, and embeddings so model comparisons are explicit.
- For model experiments, prefer per-command env overrides rather than editing `.env.local`.
- Safe experiment order:
  - baseline: `npm run bench:fit -- --url "<job-url>"`
  - faster extraction only: `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano npm run bench:fit -- --url "<job-url>"`
  - faster fit synthesis only: `OPENAI_FIT_MODEL=gpt-5-nano npm run bench:fit -- --url "<job-url>"`
  - both faster: `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano OPENAI_FIT_MODEL=gpt-5-nano npm run bench:fit -- --url "<job-url>"`
- Keep `OPENAI_CHAT_MODEL` unchanged during fit-analysis benchmarks so chat behavior does not confound the results.
- If you route fit experiments to another provider, keep chat and embeddings fixed unless the experiment explicitly targets them.
- Current benchmark findings on the live path:
  - URL fetch is sub-second and becomes effectively free on rerun with the URL cache.
  - Requirement extraction was measured at roughly 17 seconds on first run and becomes effectively free on rerun with the exact-input cache.
  - Batched evidence resolution was measured under 1 second.
  - Warm end-to-end fit checks remain dominated by the final fit-synthesis model call.
- Preliminary live model-matrix findings on the Sourgum JD:
  - `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano` was not a reliable latency win over the `gpt-5-mini` baseline and produced more generic recruiter-facing bullets.
  - `OPENAI_FIT_MODEL=gpt-5-nano` also failed to produce a clean latency win in this setup.
  - Do not change the default fit-analysis models to `gpt-5-nano` based on speed assumptions alone; require JD-level benchmark evidence plus output-quality review first.
  - Current OpenRouter free-model recommendation is task-specific rather than global:
    - `fit`: `openai/gpt-oss-120b:free` as the current default free candidate, with `qwen/qwen3-next-80b-a3b-instruct:free` as the faster but weaker alternative
    - `requirements`: `openai/gpt-oss-120b:free`
    - `chat`: keep `gpt-5-mini` for now because the tested free chat candidates failed in the current runtime
    - `embeddings`: keep `text-embedding-3-small`; `nvidia/llama-nemotron-embed-vl-1b-v2:free` remains the next embedding candidate, but the final parallel benchmark pass did not complete cleanly enough to make it the default

## Release procedure

### Common preflight checklist

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run cf:build` passes before any Cloudflare release.
- [ ] No logs or errors print raw job-description or uploaded-document content.
- [ ] Required provider credentials are configured for each routed task before release.

### Cloudflare deployment checklist

- [ ] `npm install` has been run for the current checkout.
- [ ] `npm run cf:build` completes successfully.
- [ ] `.open-next/worker.js` exists.
- [ ] `.open-next/assets` exists.
- [ ] Required provider credentials are set for the routed tasks in Cloudflare project settings or via `wrangler secret put <KEY_NAME>`.
- [ ] `OPENROUTER_API_KEY` is set if any task is routed to OpenRouter.
- [ ] Task-routing and model env vars are set as intended:
  - [ ] `AI_CHAT_PROVIDER`
  - [ ] `AI_FIT_PROVIDER`
  - [ ] `AI_REQUIREMENTS_PROVIDER`
  - [ ] `AI_EMBEDDINGS_PROVIDER`
  - [ ] `AI_CHAT_MODEL`
  - [ ] `AI_FIT_MODEL`
  - [ ] `AI_REQUIREMENTS_MODEL`
  - [ ] `AI_EMBEDDING_MODEL`
- [ ] OpenRouter metadata vars are set when OpenRouter is used:
  - [ ] `OPENROUTER_BASE_URL`
  - [ ] `OPENROUTER_HTTP_REFERER`
  - [ ] `OPENROUTER_APP_TITLE`
- [ ] Deployment is triggered with `npm run cf:deploy -- --confirm-env` only after the printed configuration is reviewed and confirmed.
- [ ] The deployed `pages.dev` URL passes smoke tests:
  - [ ] homepage renders
  - [ ] Ask AI chat returns a grounded answer in the overlay
  - [ ] pasted-text fit analysis returns a scorecard
  - [ ] URL fit analysis works for a readable public job page
  - [ ] `npm run test:url-evals` passes the enabled required live URL cases
  - [ ] TXT uploads are accepted
  - [ ] PDF uploads are accepted
  - [ ] DOCX uploads are accepted

### Vercel deployment checklist

- [ ] The Vercel project is connected to the repository and target branch.
- [ ] Required provider credentials are set in Vercel project settings or via `vercel env add <KEY_NAME>`.
- [ ] Optional task-model overrides are set if needed: `AI_CHAT_MODEL`, `AI_FIT_MODEL`, `AI_REQUIREMENTS_MODEL`, `AI_EMBEDDING_MODEL`.
- [ ] Deployment is triggered from the target branch.
- [ ] The deployed `vercel.app` URL passes smoke tests:
  - [ ] homepage renders
  - [ ] Ask AI chat returns a grounded answer in the overlay
  - [ ] pasted-text fit analysis returns a scorecard
  - [ ] URL fit analysis works for a readable public job page
  - [ ] `npm run test:url-evals` passes the enabled required live URL cases
  - [ ] TXT uploads are accepted
  - [ ] PDF uploads are accepted
  - [ ] DOCX uploads are accepted

## Side-by-side deployment procedure

1. Deploy the same commit to both Cloudflare and Vercel.
2. Keep the same OpenAI model configuration on both platforms.
3. Compare:
   - homepage load
   - chat latency and citation quality
   - fit-analysis latency for text, URL, PDF, and DOCX inputs
   - error behavior for invalid URLs and unsupported files
4. Choose the primary production host only after both default domains pass smoke checks.

## Deployment checks

- content artifacts are present in the build output
- AI context explainers exist for every required role
- chat remains stateless and uses browser-local history only
- fit analysis returns the existing UI contract
- no raw JD or uploaded file content is written to logs
- analytics remain lightweight
- `.open-next/worker.js` and `.open-next/assets` are produced for Cloudflare releases

## Fit-analysis logging

Successful fit-analysis runs now emit structured runtime log context with:

- `timestamp`
- `url` (only for URL-based checks; otherwise empty)
- `roleName`
- `company`
- `fitVerdict`
- `inputKind`
- `presentationMode`

These logs are intended for operational visibility and recruiter-activity notification hooks.
They must not include raw job-description text or uploaded-document content.
