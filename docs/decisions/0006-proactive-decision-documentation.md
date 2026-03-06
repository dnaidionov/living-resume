# ADR 0006: Proactive Decision Documentation

## Decision

Require proactive documentation of meaningful implementation, product, content, and UX decisions without explicit user prompting.

## Reasoning

- Keeps repository state auditable.
- Reduces loss of context across multi-step collaboration.
- Improves agent handoff quality and release confidence.

## Consequences

- Each meaningful change must include a documented decision record in `docs/agents/` and/or `docs/decisions/`.
- Decision records should include context, chosen option, rationale, and scope impact.
