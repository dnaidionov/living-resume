# Content Model

## Source collections

- `content/resume/roles.json`
- `content/projects/projects.json`
- `content/case-studies/case-studies.json`
- `content/faq/faq.json`
- `content/ai-context/explainers.json`
- `content/build-docs/build-docs.json`

## Rules

- Stable IDs are mandatory.
- Roles should map to one AI context explainer, except intentionally condensed legacy roles where AI context is explicitly omitted.
- Build docs are first-class retrieval content, not only docs.
- Public UI should derive from the same content artifacts used by the AI.

## AI Context Shape

- Role-level AI context is stored in `content/ai-context/explainers.json`.
- Explainers support role-level fields and optional `projectContexts[]`.
- Each `projectContexts` entry uses:
  - `title`
  - `situation`
  - `approach`
  - `work`
  - optional `lessonsLearned`
