# Repository Agent Workflow

This repository treats implementation artifacts and delivery artifacts as first-class outputs.

## Roles

- Product Architect
- Experience Designer
- Content Strategist
- AI Systems Architect
- Application Engineer
- QA / Evaluations Agent
- Ops / Release Agent

## Rules

- Every meaningful code change updates the corresponding docs.
- Architecture changes update the relevant ADR in `docs/decisions/`.
- Agent handoffs are captured in `docs/agents/handoffs.md`.
- Public build pages should derive from repo documentation instead of diverging from it.

## Delivery order

1. Product Architect
2. Experience Designer
3. Content Strategist
4. AI Systems Architect
5. Application Engineer
6. QA / Evaluations Agent
7. Ops / Release Agent
