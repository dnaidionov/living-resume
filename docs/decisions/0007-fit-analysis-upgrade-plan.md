# ADR 0007: Fit Analysis Upgrade Plan

## Decision

Upgrade fit analysis while keeping the app stateless and deployable on both Cloudflare and Vercel. The implemented shape is now:

1. LLM-based requirement extraction with heuristic fallback
2. semantic retrieval with bundled static embeddings and repo-backed artifacts
3. stronger URL intake parsing and structured-job extraction
4. QA / evaluation harness
5. deterministic recruiter-facing bullet assembly, with the LLM limited to fit synthesis and recommendation text

## Context

The fit-analysis stack already supports recruiter-brief presentation and a qualification-first rubric, but its original weakest links were:

- heuristic requirement extraction
- deterministic pseudo-semantic retrieval
- templated fallback recruiter copy
- brittle URL-page normalization
- limited regression coverage for fit quality

The product still needs to remain:

- stateless
- low-cost
- portable across Cloudflare and Vercel
- free of database requirements

## Decision details

- Add a dedicated requirement-extraction stage before fit scoring.
- Keep the heuristic extractor only as fallback.
- Move retrieval toward per-requirement evidence matching using a broad role query plus prioritized per-requirement queries.
- Keep retrieval artifacts repo-managed and bundled into the app unless scale changes materially.
- Use semantic embeddings via a generated artifact first, with live in-memory indexing as a secondary path and deterministic ranking only as the last fallback.
- Preserve the public fit-analysis API while improving internal evaluator stages.
- Keep recruiter-facing bullets deterministic so requirement-to-evidence mapping stays grounded and testable.
- Limit the LLM to internal fit synthesis, verdict calibration, and recommendation text rather than freeform recruiter-bullet generation.
- Allow up to eight source requirements and up to twelve atomic requirements after compound splitting in both primary and fallback extraction paths.
- Permit structured credential evidence only for explicit certification or knowledge requirements; split mixed clauses so execution expectations are evaluated independently.
- Normalize mixed credential requirements through a clause classifier rather than an ordered regex-patch chain: enumerate candidate boundaries, classify each side independently as knowledge, delivery, or ambiguous, and select the boundary that preserves the complete framed clause.
- Treat ambiguous mixed clauses conservatively. Credential evidence may support only independently classified knowledge clauses; it must not inherit delivery claims from a compound requirement.
- Store credential issuer as structured evidence metadata and use that provenance when rendering recruiter-facing support.

## Consequences

### Positive

- Fit bullets can map to real role requirements more reliably.
- The evaluator becomes less sensitive to ATS formatting noise.
- The architecture stays compatible with Cloudflare-only deployment.
- Recruiter-facing evidence mapping is now auditable, regression-testable, and less vulnerable to model drift.

### Negative

- Fit analysis requires additional LLM and embedding calls.
- More evaluator stages increase prompt-contract and QA complexity.
- The fallback path still needs maintenance because the system remains stateless.
- Deterministic ranking policy now carries more product responsibility, so weak evidence-selection heuristics are visible and must be refined directly rather than hidden behind model phrasing.
- The clause classifier remains a bounded natural-language heuristic, so new syntax families require positive and negative regression cases even though the architecture no longer depends on regex ordering.
