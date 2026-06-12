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
  - `featured`
  - `imagePath`
  - `title`
  - `issuer`
  - `completedDate`
  - `expirationDate`
  - `verificationUrl`
  - `summary`
  - `validatedAreas[]`
  - `tags`
- Credential expiration is stored only as evidence metadata. It is excluded from public UI and retrievable evidence text and is not used to hide, relabel, or visually downgrade the credential.
- Fit analysis may use credential evidence only for explicit certification, familiarity, or knowledge requirements. It cannot establish hands-on implementation or delivery ownership.
- Compound requirements that mix credential or knowledge language with implementation, delivery, ownership, or leadership are split into atomic requirements before retrieval and matching.
- Delivery classification uses action and experience phrases rather than bare domain nouns, so knowledge of `production-grade` architecture or `build systems` remains eligible for credential support.
- Coordinated knowledge-domain phrases such as `knowledge of Claude API and build systems` or `familiarity with CI/CD and deploy tooling` remain a single knowledge requirement; verb-shaped domain modifiers are not split into unsupported delivery claims.
- Knowledge-domain exceptions are clause-local: they do not mask a later delivery clause such as `; deploy production integrations`.
- Compound normalization handles forward and reverse knowledge/delivery order and common connectors including `and`, `as well as`, and `plus`; recursively separable clauses are normalized into atomic requirements.
- Delivery detection includes noun-form responsibility signals such as `ownership of`, `leadership of`, and `responsibility for`, preventing credential evidence from supporting execution accountability.
- Base-form delivery verbs are treated as execution signals only at clause boundaries or after action introducers such as `ability to` or `capability to`.
- Modal delivery clauses such as `must build`, `will build`, and `you will deploy` are also split and evaluated independently from credential-supported knowledge.
- Credential knowledge signals include common recruiter wording such as proficiency, expertise, and knowledgeable-about phrasing.
- Delivery detection covers common product and technical execution verbs including design, integrate, ship, manage, architect, create, launch, scale, maintain, configure, oversee, execute, drive, and run.
- Delivery introducers may contain limited adverbs, such as `ability to successfully build`, without bypassing compound splitting.
- Requirement extraction accepts up to eight source requirements and may retain up to twelve atomic requirements after splitting so normalization does not discard a source item.
- Source and atomic requirement limits are shared by the LLM and heuristic extraction paths rather than duplicated in each implementation.
- The hero selects the explicitly featured credential and derives its thumbnail and completion month from credential content.

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
