# Content Strategist Artifact: Resume Data Pack (2026-03-05)

## Inputs received

- User-approved experience draft and AI context panel content.
- User constraints:
  - EPAM clients must remain anonymous.
  - AI context format must be `Situation`, `Approach`, `Work`, optional `Lessons Learned`.
  - Cardstack and PwC wording corrections applied verbatim.
  - Earlier engineering foundation kept as condensed experience section with no AI context.

## Decisions made

- Replaced scaffold resume data with production-oriented role entries for:
  - EPAM
  - Modus Create
  - Cardstack
  - Vingis
  - PwC + Google for Work Innovation Lab
  - Realplace
  - Acision
  - Soli
  - Earlier Engineering Foundation (condensed)
- Extended AI context schema to support project/portfolio-level contexts per role via `projectContexts[]`.
- Kept existing role-level explainer fields for compatibility with current app and retrieval indexing.
- Made `ResumeRole.aiContextId` optional to support intentional AI context omission for condensed legacy roles.
- Applied the omission to `earlier-engineering-foundation`.
- Removed homepage `Selected Initiatives` and `What to ask next` sections to keep focus on core experience evidence and AI context.

## Requirements documented

### Data requirements

- Stable IDs are required for all roles and explainers.
- EPAM contexts must stay anonymized.
- `projectContexts[]` entries must include:
  - `id`
  - `title`
  - `situation`
  - `approach`
  - `work`
- `lessonsLearned` is optional and only present where explicitly provided.
- Earlier engineering section remains condensed and has no AI context entry.

### Content requirements

- Preserve user-provided phrasing and ownership signals (`Led`, `Owned parts of`, etc.).
- Keep metrics tied to source claims; avoid adding unsupported precision.
- Maintain separation between role-level summary and project-level context.

### Validation requirements

- Test contract: only roles with declared `aiContextId` require matching explainer.
- Content index generation should continue to include both role-level and explainer-level text.

## Open assumptions

- UI rendering for `projectContexts[]` will be implemented by Application Engineer in a follow-up.
- Current UI compatibility is preserved by retaining legacy explainer fields.
- Project IDs in `relatedProjectIds` remain optional unless downstream retrieval requires stricter linkage.

## Deliverables

- `content/resume/roles.json`
- `content/ai-context/explainers.json`
- `types/content.ts`
- `tests/content-store.test.ts`
- `docs/architecture/content-model.md`
- `docs/decisions/0005-ai-context-project-granularity.md`
- `docs/decisions/0006-proactive-decision-documentation.md`
- `docs/agents/content-strategist-resume-data-pack-2026-03-05.md`
- `docs/agents/decision-log.md`

## Acceptance criteria for next role

- Application Engineer can consume `projectContexts[]` and render per-project AI context blocks.
- Existing app remains compilable with current schema types.
- Retrieval and tests pass with legacy-role AI-context omission rule.
