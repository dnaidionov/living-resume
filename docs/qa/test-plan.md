# Test Plan

## Functional

- Homepage renders
- Resume roles render
- Every role opens AI context
- Chat route returns a grounded answer; the overlay should display only the answer text, not visible citations
- Chat route accepts short conversation history without server-side persistence
- Resume-chat overlay does not render source/proof rows beneath assistant answers
- Resume-chat overlay sends on `Cmd+Enter` (macOS) and `Ctrl+Enter` (Windows/Linux) while plain `Enter` remains available for multiline input
- Resume-chat overlay normalizes message whitespace so empty lines do not inflate bubble height
- Resume-chat overlay shows a compact typing-dots indicator while waiting for an answer instead of a loading bubble
- Resume-chat overlay routes fit-check requests into the dedicated Role Fit section instead of answering about system capability; if the user confirms, it should prefill the correct tab (`Use URL` or `Paste text`) and auto-submit the analysis
- Resume-chat fit-check handoff should render explicit `Sure, do it` and `No, stay here` actions; declining should leave chat open and reply `Ok, staying here.`
- Resume-chat composer should take focus on open and regain focus after replies or local handoff dismissal so the user can keep typing without extra clicks
- Build/process chat questions such as `how is this system built`, `how is this site built`, or `how is this built` should be interpreted as questions about the Career Twin product rather than as generic site trivia
- Build/process chat answers should end with a short pointer to the source and documentation on GitHub: `https://github.com/dnaidionov/living-resume`
- Visible chat answers should not leak raw `Evidence 1` / `Evidence 2` style markers into the overlay
- Build/process chat answers should normalize stale `Living Resume` phrasing to `Career Twin` in visible output
- Assistant-rendered URLs in the chat overlay should be clickable
- Assistant-rendered URLs in the chat overlay should exclude trailing punctuation from the anchor target
- Fit-analysis results should show the extracted role/company label above the analysis body when the JD exposes it clearly enough
- Target-summary regressions must verify the source precedence order: structured payloads first, then page metadata/title, then URL-derived company identity, with JD-text heuristics used only as backup
- Target-summary regressions must also verify title-conflict handling: if recruiter-readable JD content clearly states a different role title than metadata, the displayed target summary should prefer the JD title while preserving company identity from the stronger source.
- Live URL eval fixtures may validate parsed JD title/company separately from the structured target-summary label when ATS metadata and visible body copy disagree
- Fit-analysis route returns structured output from text, URL, and file inputs
- URL-based fit-analysis tests must verify that fetched JD content, not the literal URL string, is used for requirement extraction and evidence retrieval while `metadata.inputKind` remains `url`
- Live URL-ingestion regression coverage is fixture-driven from `tests/fixtures/url-fit-analysis-cases.json`; the enabled required build-gate set currently includes Waymo, Sourgum, Motive, and Netflix product-role URLs
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
- Recruiter-brief bullets must remain deterministic even when the LLM returns weaker recruiter-facing bullet content; tests should verify that LLM-provided bullets do not override deterministic evidence selection
- Requirement extraction returns role requirements/functions/expectations rather than titles, locations, or ATS boilerplate
- Retrieval prefers semantic embeddings when a generated artifact or live embedding path is available, and falls back deterministically only when semantic mode is unavailable
- Fit-analysis retrieval should merge a broad role-text query with prioritized per-requirement queries so downstream requirement matching can choose distinct, role-appropriate evidence instead of overfitting to the top few broad-query chunks
- Fit-analysis regressions must verify that recruiter-facing `Where I match` output selects the strongest 3 to 5 supported bullets from the broader candidate pool and does not surface lower-value culture/environment statements
- Fit-analysis metadata reports stage versions so fallback vs primary-path results can be distinguished in QA
- URL intake removes generic header/footer/application/legal boilerplate while preserving role headings and bullet lists
- URL intake regression tests must cover embedded ATS JSON/JSON-LD job payloads and reject serialized theme/config blobs from appearing as readable role content
- URL intake regression tests must also cover sparse-shell fallbacks (title/meta description) and explicit JS-rendered-page errors when no meaningful role content can be recovered
- Live URL evals must assert that enabled required build-gate cases recover the expected job title and company from the fetched JD, produce parsed requirements without raw URL leakage, and complete recruiter-brief fit analysis
- Fixture `expectedOutcome` is advisory rather than gating: outcome mismatches emit QA warnings but do not fail the test, while ingestion/parsing/analysis failures still fail the suite
- Fit-analysis eval fixtures cover at least: non-AI product role, AI-native role, and obvious stretch role
- Fit-analysis regression tests must cover: non-product-role gating, repeated-evidence collapsing, modern-LLM recency checks, and technology-context mismatch handling
- Recruiter-facing evidence text must be validated against explicit company provenance so AI-context headlines never appear where an employer name should be shown
- Negative recruiter briefs must render 3 to 5 mismatch bullets with requirement-specific explanations such as missing mobile depth, certifications, clearance, or hands-on implementation context
- Negative recruiter briefs must collapse repeated mismatch explanations to `Same as above.` and reject inconsistent pairings such as certification gaps attached to unrelated technology requirements
- `What does transfer` must render capability-based titles instead of prior role titles, and its evidence text must never use an AI-context or project headline as a fake employer name
- Fit-analysis regressions must verify that company-mission/brand-intro prose does not surface as a match bullet, that encoded HTML artifacts do not appear in bullet headers, and that positive bullets do not reuse the same evidence chunk
- Fit-analysis regressions must verify that culture/work-environment lines do not surface as match bullets and that player-coach/team-process requirements prefer leadership/process evidence over isolated technical workflows
- Fit-analysis regressions must verify that leadership/team/process requirements prefer explicit management/process evidence over outcome-heavy portal/project evidence when both are available
- Fit-analysis regressions must verify that direct people-management requirements move into `Gaps to note` when the corpus shows only adjacent senior-product leadership rather than explicit team-management or mentoring proof
- Fit-analysis regressions must verify that repeated positive explanations are grouped into one evidence block with multiple requirement bullets instead of rendering duplicate cards
- Fit-analysis regressions must verify that anonymized portfolio-summary evidence is rewritten into concrete engagement examples instead of surfacing internal anonymization wording
- Fit-analysis regressions must verify that, when evidence is otherwise comparable, newer experience is preferred over older experience in recruiter-facing support selection
- Fit-analysis regressions must verify that recruiter-facing evidence excludes portfolio/meta project artifacts and other non-experience repo content
- Fit-analysis regressions must verify that broad catch-all consulting evidence such as Vingis loses tie-breaks against more concrete matching role/project evidence
- Fit-analysis regressions must verify that generic PM-evidence sentences prefer the latest relevant named role when available and otherwise fall back to a neutral `In my previous roles...` phrasing without naming Vingis
- Fit-analysis regressions must verify that grouped generic PM bullets prefer a recent dual-role summary such as `EPAM and Modus Create` when those roles are available
- Fit-analysis regressions must verify that broad senior-product qualification bullets use a cross-role leadership summary rather than a narrow one-off explainer
- Fit-analysis regressions must verify that catch-all Vingis evidence is rendered with neutral `In my previous roles...` phrasing instead of naming Vingis directly in recruiter-facing support text
- Fit-analysis regressions must verify that strategic-execution requirements prefer explicit strategy/discovery/roadmap evidence over outcome-heavy portal/project evidence
- Fallback behavior remains usable when `OPENAI_API_KEY` is missing

## Operational

- Cloudflare and Vercel deployment paths remain documented
- `npm run build` and `npm run cf:build` must fail if the enabled required live URL evals fail
- Cloudflare adapter build produces `.open-next/worker.js` before release
- Logs avoid raw JD and uploaded-document content
- Analytics events remain lightweight
- Runtime dependencies remain compatible with both target hosts
