# ADR 0007: Fit Analysis Upgrade Plan

## Decision

Upgrade fit analysis in five phases while keeping the app stateless and deployable on both Cloudflare and Vercel:

1. LLM-based requirement extraction
2. semantic retrieval with static embeddings
3. fallback-path de-templating and evaluator versioning
4. stronger URL intake parsing
5. QA / evaluation harness

## Context

The current fit-analysis stack already supports recruiter-brief presentation and a qualification-first rubric, but its weakest links are:

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
- Move retrieval toward per-requirement evidence matching.
- Keep retrieval artifacts repo-managed and bundled into the app unless scale changes materially.
- Preserve the public fit-analysis API while improving internal evaluator stages.

## Consequences

### Positive

- Fit bullets can map to real role requirements more reliably.
- The evaluator becomes less sensitive to ATS formatting noise.
- The architecture stays compatible with Cloudflare-only deployment.

### Negative

- Fit analysis requires additional LLM and embedding calls.
- More evaluator stages increase prompt-contract and QA complexity.
- The fallback path still needs maintenance because the system remains stateless.
