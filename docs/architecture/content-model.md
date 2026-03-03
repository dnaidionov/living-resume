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
- Every role must map to one AI context explainer.
- Build docs are first-class retrieval content, not only docs.
- Public UI should derive from the same content artifacts used by the AI.
