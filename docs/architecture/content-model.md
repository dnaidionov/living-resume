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
- Coordinated knowledge-domain phrases using `and`, `plus`, `as well as`, or slash-separated lists, such as `knowledge of Claude API plus build systems` and `knowledge of Claude API / MCP / build systems`, remain a single knowledge requirement; verb-shaped domain modifiers are not split into unsupported delivery claims.
- Knowledge-domain exceptions are clause-local: they do not mask a later delivery clause such as `; deploy production integrations`.
- Recursive compounds preserve the complete knowledge frame before separating a later delivery clause, so `knowledge of Claude API plus build systems plus deploy production integrations` becomes one knowledge atom and one delivery atom.
- Compound normalization handles forward and reverse knowledge/delivery order and common connectors including `and`, `as well as`, and `plus`; recursively separable clauses are normalized into atomic requirements.
- Delivery detection includes noun-form responsibility signals such as `ownership of`, `leadership of`, and `responsibility for`, preventing credential evidence from supporting execution accountability.
- Base-form delivery verbs are treated as execution signals only at clause boundaries or after action introducers such as `ability to` or `capability to`.
- Modal delivery clauses such as `must build`, `will build`, and `you will deploy` are also split and evaluated independently from credential-supported knowledge.
- Modal and expectation delivery clauses also include `should`, `can`, `could`, `may`, `expected to`, and `needs to`.
- Explicit actor wording includes bounded multiword subjects such as `the successful candidate will deploy` or `a successful applicant will deploy`, expectation phrasing such as `you are expected to deploy`, and contractions such as `you'll` / `you'd deploy`.
- Actor coverage includes plural candidates/applicants, direct pronouns, `the person in this role`, and recruiter expectation clauses; actor terms embedded inside relative knowledge descriptions are not treated as clause starts.
- Actor coverage also includes role-holder/incumbent language, actor-specific `is/are expected to` and `needs to`, and actor-prefixed `must be able to`.
- Credential knowledge signals include common recruiter wording such as `proficiency with`, `proficiency in`, `proficient with`, `proficient in`, expertise, and knowledgeable-about phrasing.
- Delivery detection covers common product and technical execution verbs including design, integrate, ship, manage, architect, create, launch, scale, maintain, configure, oversee, execute, drive, and run.
- Delivery introducers may contain limited adverbs, such as `ability to successfully build`, without bypassing compound splitting.
- Delivery introducers include ability phrasing such as `be able to deploy` and `able to deploy`.
- Coordinated clauses may also begin with limited adverbs, gerunds, passive or progressive-passive delivery wording, or `while`/`whereas`; dash, pipe, ampersand, and slash separators are treated as clause boundaries only when the two sides independently validate as knowledge and delivery.
- Separator-heavy recursive compounds split at the rightmost valid knowledge/delivery boundary so earlier knowledge-list items are preserved.
- Separator recognition is clause-aware: technology names such as `CI/CD`, `R&D`, and hyphenated knowledge domains are not split, and modal verbs inside relative clauses do not become candidate delivery obligations.
- Action-shaped domain nouns such as `design systems`, `design patterns`, `build-vs-buy tradeoffs`, and `design and architecture patterns` remain knowledge context across supported separators rather than execution claims.
- Accountability suffixes override domain protection, so `design systems ownership` is evaluated as delivery responsibility.
- Accountability suffixes include architecture ownership but exclude conceptual phrases such as ownership models, leadership principles, and responsibility matrices.
- Explicit accountability grammar (`ownership of`, `leadership of`, `responsibility for`) takes precedence over conceptual suffix exemptions.
- Knowledge language does not suppress delivery found elsewhere in the same clause; alternating knowledge/delivery frames are normalized before credential eligibility is evaluated.
- Coordinated delivery verbs that share an object remain one delivery atom rather than being split into standalone verb fragments.
- Delivery evidence framing such as `track record of building`, `demonstrated success deploying`, years-of-experience phrasing, `accountable for`, and past-tense oversight is execution evidence and cannot be supported by a credential.
- Operational execution verbs such as optimize, monitor, troubleshoot, and test, plus deployment-accountability nouns, are delivery evidence rather than credential-supported knowledge.
- Broader accountability and delivery-history framing, including accountability for, ownership over, proven success, history of delivery, and assigned/charged work, is execution evidence.
- `with` is a clause boundary only for validated action introducers; generic `with` inside phrases such as `experience with building` remains part of the delivery atom.
- Operational gerunds followed by domain nouns, such as monitoring tools and testing methodologies, remain knowledge domains when coordinated under an explicit knowledge frame.
- Knowledge claims qualified by execution history, such as knowledge gained, developed, acquired, demonstrated, derived from, or based on building, deploying, or implementing, are delivery-bearing requirements; unsplit clauses are recategorized from model-provided `requirement` to `function` when delivery classification applies.
- Reverse recursive slash compounds split at the knowledge boundary so valid credential-supported knowledge is retained.
- Recruiter-facing credential support identifies Anthropic as issuer and is phrased as certification validation, never as employment or prior-role experience.
- Credential issuer attribution is derived from structured credential metadata rather than display text or topical tags.
- Requirement extraction accepts up to eight source requirements and may retain up to twelve atomic requirements after splitting so normalization does not discard a source item.
- Source and atomic requirement limits are shared by the LLM and heuristic extraction paths rather than duplicated in each implementation.
- Heuristic extraction ranks all defensible source requirements before applying the eight-source cap, then splits retained compounds within the twelve-atomic cap.
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
