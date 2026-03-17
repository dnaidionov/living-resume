# Runbook

## Local setup

1. Install dependencies with `npm install`.
2. Run the test suite with `npm test`.
3. Run a production build with `npm run build`.
4. Run the dev server with `npm run dev` if you need a local smoke test.

## Environment variables

- `OPENAI_API_KEY`
- optional: `OPENAI_CHAT_MODEL` (defaults to `gpt-5-mini`)
- optional: `OPENAI_FIT_MODEL` (defaults to `gpt-5-mini`)
- optional: `NEXT_PUBLIC_FIT_PRESENTATION_MODE` (`recruiter_brief` or `scorecard`, defaults to `recruiter_brief`)
- optional: `OPENAI_EMBEDDING_MODEL` (defaults to `text-embedding-3-small`)

## Semantic Retrieval Artifact

- Run `npm run embeddings:build` after materially changing resume, project, FAQ, or AI-context content.
- Do not rebuild embeddings for code-only changes such as UI work, route logic, prompt tuning, tests, deployment config, or styling when the retrieval corpus itself is unchanged.
- The rebuild trigger is a retrieval-corpus change, not a specific agent role. Any agent that materially changes indexed content is responsible for regenerating the artifact before handoff or release.
- This writes `content/retrieval/embeddings.generated.json`.
- If the artifact is missing or empty in an environment with `OPENAI_API_KEY`, the app can build a live in-memory semantic index at runtime.
- If neither the artifact nor the API key is available, retrieval falls back to deterministic local ranking.

## Secret handling

- Never commit API keys to the repository.
- Never place production secrets in tracked files such as `next.config.ts`, JSON config, or docs.
- For local development, use an untracked `.env.local`.
- Standalone repo scripts such as `npm run embeddings:build` and `npm run content:build` load `.env.local` automatically.
- For Cloudflare, store secrets in the project or Worker settings, or use `wrangler secret put OPENAI_API_KEY`.
- For Vercel, store secrets in the project environment settings, or use `vercel env add OPENAI_API_KEY`.

## Release procedure

### Common preflight checklist

- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run cf:build` passes before any Cloudflare release.
- [ ] No logs or errors print raw job-description or uploaded-document content.
- [ ] `OPENAI_API_KEY` is configured on the target platform before release.

### Cloudflare deployment checklist

- [ ] `npm install` has been run for the current checkout.
- [ ] `npm run cf:build` completes successfully.
- [ ] `.open-next/worker.js` exists.
- [ ] `.open-next/assets` exists.
- [ ] `OPENAI_API_KEY` is set in Cloudflare project settings or via `wrangler secret put OPENAI_API_KEY`.
- [ ] Optional model overrides are set if needed: `OPENAI_CHAT_MODEL`, `OPENAI_FIT_MODEL`.
- [ ] Deployment is triggered with `npm run cf:deploy`.
- [ ] The deployed `pages.dev` URL passes smoke tests:
  - [ ] homepage renders
  - [ ] chat returns an answer with citations
  - [ ] pasted-text fit analysis returns a scorecard
  - [ ] URL fit analysis works for a readable public job page
  - [ ] `npm run test:url-evals` passes the enabled required live URL cases
  - [ ] TXT uploads are accepted
  - [ ] PDF uploads are accepted
  - [ ] DOCX uploads are accepted

### Vercel deployment checklist

- [ ] The Vercel project is connected to the repository and target branch.
- [ ] `OPENAI_API_KEY` is set in Vercel project settings or via `vercel env add OPENAI_API_KEY`.
- [ ] Optional model overrides are set if needed: `OPENAI_CHAT_MODEL`, `OPENAI_FIT_MODEL`.
- [ ] Deployment is triggered from the target branch.
- [ ] The deployed `vercel.app` URL passes smoke tests:
  - [ ] homepage renders
  - [ ] chat returns an answer with citations
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
