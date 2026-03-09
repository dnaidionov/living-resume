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

## Secret handling

- Never commit API keys to the repository.
- Never place production secrets in tracked files such as `next.config.ts`, JSON config, or docs.
- For local development, use an untracked `.env.local`.
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
