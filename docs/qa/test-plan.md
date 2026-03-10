# Test Plan

## Functional

- Homepage renders
- Resume roles render
- Every role opens AI context
- Chat route returns grounded answer plus citations
- Chat route accepts short conversation history without server-side persistence
- Fit-analysis route returns structured output from text, URL, and file inputs
- Fit-analysis route supports both `recruiter_brief` and `scorecard` presentation modes
- PDF and DOCX uploads parse into readable role text
- Build page renders documented process artifacts

## Quality

- AI context stays aligned with source role content
- Citations point to actual content records
- Fit output remains candid and penalizes unsupported requirements
- General product JDs do not receive lower fit solely because they omit specialized domain language
- Gaps are phrased as validation points rather than premature rejection signals
- Recruiter-facing fit output never mentions preferred domains, absent AI wording, or internal scoring logic
- Requirement extraction returns role requirements/functions/expectations rather than titles, locations, or ATS boilerplate
- Retrieval prefers semantic embeddings when a generated artifact or live embedding path is available, and falls back deterministically only when semantic mode is unavailable
- Fit-analysis metadata reports stage versions so fallback vs primary-path results can be distinguished in QA
- URL intake removes generic header/footer/application/legal boilerplate while preserving role headings and bullet lists
- URL intake regression tests must cover embedded ATS JSON/JSON-LD job payloads and reject serialized theme/config blobs from appearing as readable role content
- URL intake regression tests must also cover sparse-shell fallbacks (title/meta description) and explicit JS-rendered-page errors when no meaningful role content can be recovered
- Fit-analysis eval fixtures cover at least: non-AI product role, AI-native role, and obvious stretch role
- Fit-analysis regression tests must cover: non-product-role gating, repeated-evidence collapsing, modern-LLM recency checks, and technology-context mismatch handling
- Recruiter-facing evidence text must be validated against explicit company provenance so AI-context headlines never appear where an employer name should be shown
- Negative recruiter briefs must render 3 to 5 mismatch bullets with requirement-specific explanations such as missing mobile depth, certifications, clearance, or hands-on implementation context
- Negative recruiter briefs must collapse repeated mismatch explanations to `Same as above.` and reject inconsistent pairings such as certification gaps attached to unrelated technology requirements
- `What does transfer` must render capability-based titles instead of prior role titles, and its evidence text must never use an AI-context or project headline as a fake employer name
- Fit-analysis regressions must verify that company-mission/brand-intro prose does not surface as a match bullet, that encoded HTML artifacts do not appear in bullet headers, and that positive bullets do not reuse the same evidence chunk
- Fit-analysis regressions must verify that anonymized portfolio-summary evidence is rewritten into concrete engagement examples instead of surfacing internal anonymization wording
- Fit-analysis regressions must verify that, when evidence is otherwise comparable, newer experience is preferred over older experience in recruiter-facing support selection
- Fit-analysis regressions must verify that recruiter-facing evidence excludes portfolio/meta project artifacts and other non-experience repo content
- Fallback behavior remains usable when `OPENAI_API_KEY` is missing

## Operational

- Cloudflare and Vercel deployment paths remain documented
- Cloudflare adapter build produces `.open-next/worker.js` before release
- Logs avoid raw JD and uploaded-document content
- Analytics events remain lightweight
- Runtime dependencies remain compatible with both target hosts
