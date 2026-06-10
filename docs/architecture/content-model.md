# Content Model

## Source collections

- `content/resume/roles.json`
- `content/projects/projects.json`
- `content/credentials/credentials.json`
- `content/case-studies/case-studies.json`
- `content/faq/faq.json`
- `content/ai-context/explainers.json`
- `content/build-docs/build-docs.json`

## Rules

- Stable IDs are mandatory.
- Roles should map to one AI context explainer, except intentionally condensed legacy roles where AI context is explicitly omitted.
- Build docs are first-class retrieval content, not only docs.
- Public UI should derive from the same content artifacts used by the AI.
- Project entries may use different narrative shapes depending on project type, but the content artifact remains the shared source for both page rendering and retrieval indexing.
- Credential entries are used for compact public display and as retrievable evidence for resume questions and fit analysis.

## Credential Shape

- Credentials are stored in `content/credentials/credentials.json`.
- Each credential entry includes:
  - `id`
  - `title`
  - `issuer`
  - `completedDate`
  - `expirationDate`
  - `verificationUrl`
  - `summary`
  - `validatedAreas[]`
  - `tags`
- Credential expiration is stored as evidence metadata but is not used to hide, relabel, or visually downgrade the public credential.
- Fit analysis may use credential evidence only for explicit certification, familiarity, or knowledge requirements. It cannot establish hands-on implementation or delivery ownership.

## Project Shape

- Projects are stored in `content/projects/projects.json`.
- Each project entry includes:
  - `id`
  - `name`
  - `projectType`
  - `summary`
  - `status`
  - `tags`
  - `relatedRoleIds`
- Product/system projects may also include:
  - `context`
  - `build`
  - `keyDecisions[]`
  - `significance`
  - optional `link`
- Personal-build projects may also include:
  - `why`
  - optional `link`

## AI Context Shape

- Role-level AI context is stored in `content/ai-context/explainers.json`.
- Explainers support role-level fields and optional `projectContexts[]`.
- Each `projectContexts` entry uses:
  - `title`
  - `situation`
  - `approach`
  - `work`
  - optional `lessonsLearned`
