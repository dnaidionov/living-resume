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
- Every meaningful product/content/UX decision must be documented proactively (without requiring explicit user prompt) in the current role artifact and/or decision log.

## Delivery order

1. Product Architect
2. Experience Designer
3. Content Strategist
4. AI Systems Architect
5. Application Engineer
6. QA / Evaluations Agent
7. Ops / Release Agent

## How to invoke an agent

Name the agent explicitly in your request and state the task you want that role to handle.

Examples:

- `Use the Product Architect agent to refine the homepage positioning.`
- `Act as the AI Systems Architect and define the retrieval and prompt contracts.`
- `Have the QA / Evaluations Agent review the fit-analysis flow.`

For multi-agent work, specify the sequence:

1. `Content Strategist`
2. `AI Systems Architect`
3. `Application Engineer`

Important:

- Invoking an agent means asking Codex to operate in that documented role.
- The repository currently documents the agent workflow; it does not run a separate automated multi-agent runtime.
- Each agent should produce role-appropriate artifacts and handoff notes in `docs/agents/` and the relevant docs folders.
