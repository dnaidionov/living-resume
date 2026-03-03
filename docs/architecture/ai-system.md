# AI System

## Modes

- Resume QA
- Fit analysis
- Build / process QA

## Guardrails

- Use curated content only for self-claims.
- Show citations for substantive answers.
- Distinguish proven, adjacent, and unsupported evidence.
- Keep JD inputs ephemeral.

## Runtime approach

The current repo includes:

- a retrieval abstraction
- a chat model abstraction
- a fit-analysis service abstraction

The current implementation uses deterministic local retrieval and a placeholder OpenAI-backed model wrapper so the app remains runnable without a full production prompt stack wired in.
