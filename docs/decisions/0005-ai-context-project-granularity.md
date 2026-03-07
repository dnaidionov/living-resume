# ADR 0005: AI Context Project Granularity and Legacy Opt-Out

## Decision

Adopt project/portfolio-level AI context entries under each role explainer via `projectContexts[]`.

Allow intentional AI-context omission for condensed legacy roles by making `ResumeRole.aiContextId` optional.

## Reasoning

- Role-level explainers were too coarse for multi-portfolio engagements.
- Recruiter trust improves when claims are inspectable at project granularity (`Situation -> Approach -> Work -> Lessons Learned`).
- Condensed early-career sections can be retained without forced low-value AI context.

## Consequences

- `AIContextExplainer` now supports optional `projectContexts[]` entries.
- Content validation and tests must only enforce explainer presence when a role explicitly declares `aiContextId`.
- Authoring guidance must include anonymization rules and required project-context fields.
