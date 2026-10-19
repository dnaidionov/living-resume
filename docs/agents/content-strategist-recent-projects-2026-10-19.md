# Recent Projects Content — 2026-10-19

## Inputs received

- User request to add Ask OHNY, school lunch ordering, and Library Shelf, using their GitHub descriptions.
- Current project narratives, content model, PRD, editorial guidance, architecture decisions, and retrieval-artifact runbook.
- GitHub default-branch sources read on 2026-10-19:
  - [Ask OHNY README](https://github.com/dnaidionov/OHNY-skills/blob/main/README.md)
  - [Library Shelf README](https://github.com/dnaidionov/library-shelf/blob/main/README.md), blob `efb7658022944092fef86a772f13b61732c89895`
  - [Foodease README](https://github.com/dnaidionov/foodease-school-lunch/blob/main/README.md), blob `2109e0da1141a64767182ceff9657df3b157fc6c`
  - [Foodease skill](https://github.com/dnaidionov/foodease-school-lunch/blob/main/SKILL.md), blob `a02c2c5ebbb2e9c01eb832fcc6b76c4ef90ed806`

## Decisions made

- Add all three as product/system projects using the existing summary, problem, build, decisions, significance, and status fields. The existing renderer already supports these fields, so no UI or schema change is needed.
- Lead with practical user outcomes, then explain the implementation and tradeoffs. Brief summaries alone would be easier to scan, but would omit the reasoning that the existing portfolio format is designed to make inspectable. Keep summaries concise and supporting sections specific.
- Preserve the first occurrence of Library Shelf: Ask OHNY → Library Shelf → Research Assistant → School Lunch Ordering → MyBrain → Digital Career Twin → Dalek. Literal duplication would follow the eight-item list but repeat the same project without distinct evidence; one entry is the stronger interpretation of the three-project addition request. The user subsequently confirmed one entry in second place.
- Keep existing project IDs and narratives intact. New independent projects have no employer links: GitHub evidence supports personal project work, not attribution to an employer.
- Describe implemented capabilities without invented adoption, impact metrics, official affiliations, or public-directory approval. Keep Library Shelf's snapshot and imperfect matching and Foodease's no-payment boundary visible. Following user proofreading, omit OHNY approval status from portfolio copy; describe supported assistant installation and mobile/voice use instead.
- Regenerate the semantic retrieval artifacts because these entries feed both the website and AI evidence. No runtime or architecture change is required.

## Open assumptions

- No unresolved ordering question: the user confirmed Library Shelf once, in second place.
- Repository descriptions establish implementation scope; this pass does not independently test those external tools or their consumer onboarding.

## Deliverables

- `content/projects/projects.json`: three sourced narratives and editorial ordering.
- `tests/project-content.test.ts`: order, uniqueness, narrative/index coverage, provenance, and boundary checks, written and run before content changes.
- Updated PRD, content model, QA plan, decision log, handoff, and regenerated retrieval artifacts.

## Acceptance criteria for next role

- Confirm tests and production-build gates pass before release.
- Preview the cards using the existing homepage renderer.
- Publishing remains a separate release action; local content changes do not establish deployment.

## Validation results

- New content tests: 3/3 pass after the content change; initially 0/3 because the entries and order were absent.
- Regenerated embeddings: 193 documents; manifest verification passes.
- TypeScript: `npx tsc --noEmit` fails on two errors in unchanged test files: implicit-any at `tests/chat-service.test.ts:299` and un-narrowed presentation union access at `tests/prompting.test.ts:1049`. These are outside the content update.
- Local browser preview: all seven project cards render in the requested order with the new descriptions and GitHub links.
- Full suite: 259 pass, 3 fail. Initial restricted-network run failed DNS; the network-enabled retry reached external services but still failed Waymo fetching, Sourgum readable-JD extraction, and Motive expected-title matching.
- `npm run build` fails at the live URL gate as required. These failures occur in external URL ingestion/assertions before project retrieval, so the content change cannot explain them. Parser regressions versus expired/changed postings remain unresolved; do not label either cause proven or disable the gate as part of this content task.
- No production deployment was performed.

## Proofreading revision — 2026-10-19

- User direction: emphasize direct installation into popular AI assistants, on-the-go use, and voice for Ask OHNY; remove approval status. Focus Library Shelf on books available now versus long waiting lists. Explain School Lunch Ordering as relief from Foodease’s repetitive UI, including defaults, repeat orders, and customizations.
- Applied: named ChatGPT, Claude, and Gemini rather than making an unbounded “any assistant” claim. The source README supports voice in ChatGPT and Claude and text in Gemini. This preserves the requested broad positioning without implying Gemini voice support. Approval status is irrelevant to this portfolio narrative and has been removed without claiming approval.
- Library Shelf’s problem statement now contrasts the reading backlog with immediate borrowing availability and waiting lists; its value statement explicitly says “available right now.” This describes finding available books, not predicting precise waiting-list durations.
- School Lunch Ordering now identifies the avoidable clicking as the problem and makes delegation to the skill explicit. Describing the concrete friction is more informative than calling the UI “terrible.”
- Tests updated before content: two failed as expected against the previous copy, then all four project-content tests passed. Embeddings regenerated for all 193 documents; local browser preview confirms the revised descriptions, no approval-status copy, and unchanged project order.
- Earlier full-suite and TypeScript failures above remain unresolved; this copy revision does not alter those gates or claim a passing production build.

## Release attempt — 2026-10-19

- User authorized commit, push, and publication after proofreading.
- Remote `main` matched local HEAD before committing; no upstream changes needed integration.
- Full release suite: 260 pass, 3 fail (263 total). Failures remain Waymo fetch, Sourgum insufficient readable JD, and Motive expected-title mismatch.
- Deployment preflight found the local environment missing `OPENROUTER_HTTP_REFERER`; supplied `https://naidionov.com` for the command, matching the existing production configuration. No stored environment or model-routing values were changed.
- Ran `OPENROUTER_HTTP_REFERER=https://naidionov.com npm run cf:deploy -- --confirm-env`. Environment preflight passed; the Cloudflare build failed because all three required external URL checks failed (0/3 passing). Deployment was never reached and production remains unchanged.
- Retain the release gate and commit/push the reviewed content. Publishing remains blocked pending resolution of the live-URL checks; no claim of a successful production build or release.
