# Cross-Agent Plan Additions (2026-03-10)

## Purpose

Capture the next set of planned improvements requested after the current one-page recruiter flow pass. This document now distinguishes between work that has already landed and work that remains open, so it does not continue to present completed implementation as pending.

## Status summary

### Completed from this plan

- senior-signal strengthening across later experiences and related fit-analysis handling
- explicit Modus/Verizon cloud redesign coverage
- recruiter-facing semantic fit-result coloring
- major chat UX/runtime review and resulting interaction changes
- broader capability-coverage work across retrieval-visible experience and AI-context content

### Still open

- further deployed-performance improvements, especially LLM response-time optimization
- further deterministic ranking refinement for senior leadership / player-coach / strategic-execution bullets
- any remaining content-coverage gaps that require explicit Content Strategist review and approval

## Original requested plan additions

1. Strengthen later experiences, especially EPAM, Modus, and Cardstack, to better signal senior product strategy, leadership, and other senior-level capabilities.
2. Revise the Modus experience to explicitly include cloud solution redesign work for Verizon.
3. Color-code fit assessment results using a clear success/warning/fail scheme such as green, orange, and red, and render the overall assessment plus bullet headers in the corresponding color.
4. Review how chat currently works and document what should change in the interaction and response model.
5. Recommend performance improvements, with special attention to deployed LLM response time because local behavior is already fast.
6. Review the AI context and experience corpus to make sure it covers the wide array of relevant skills and experiences that may satisfy role requirements, including integrations, data analysis, databases, GTM, training, cost estimation, and similar senior-level capability signals.

## Updated agent classification

### Product Architect

- Keep the product contract aligned with the shipped Career Twin behavior, especially the separation between personal hero positioning and system-facing product framing.
- Maintain clarity about where chat ends and the dedicated fit-analysis workflow begins.
- Evaluate whether future performance work should preserve the current interaction model or introduce new staged/streaming behavior.

### Content Strategist

- Maintain approved resume / AI-context content and review any future edits role-by-role before they land.
- Focus new content work only on genuinely missing qualification evidence, not on copy churn for already-covered capabilities.

### Experience Designer

- Maintain the shipped fit-result semantic color system and chat interaction model.
- Review only incremental UX refinements rather than re-opening the core interaction model that is already implemented.

### AI Systems Architect

- Continue latency work with emphasis on deployed LLM response time rather than local behavior.
- Continue deterministic ranking refinement for leadership, player-coach, and strategic-execution requirements.
- Keep the current architecture boundary: deterministic recruiter-facing bullets, LLM-limited synthesis/recommendation.

### Application Engineer

- Keep the current Career Twin chat/fit/build interaction contract intact while applying future performance or ranking improvements.
- Avoid changing source content directly without explicit user review.

### QA / Evaluations Agent

- Keep regression coverage aligned with the shipped chat handoff, fit-color, deterministic recruiter-brief, and build-question behaviors.
- Add performance-oriented checks or benchmarks for deployed chat behavior where practical, especially around first-token latency and timeout risk.

### Ops / Release Agent

- Document production-performance recommendations for Cloudflare deployment, especially network-region considerations, cold-start behavior, observability, and model request timing.
- Add runbook guidance for monitoring LLM latency separately from total request time.
- Recommend release-safe rollout steps for chat-performance changes, such as logging, thresholds, and before/after comparison criteria.

## Remaining handoff order

1. Product Architect confirms any further changes do not reopen the shipped Career Twin interaction model unnecessarily.
2. Content Strategist reviews only genuinely missing capability coverage that still cannot be proven from the current corpus.
3. AI Systems Architect refines latency strategy and deterministic ranking policy for the remaining weak fit-analysis cases.
4. Application Engineer implements approved performance and ranking changes without changing source content unless explicitly approved.
5. QA / Evaluations Agent validates performance, grounding, and regression behavior.
6. Ops / Release Agent updates deployment/runbook guidance for latency and monitoring.

## Acceptance criteria for the remaining implementation pass

- The existing senior-signal, Modus/Verizon, fit-color, and chat-behavior work remains intact.
- Remaining ranking changes improve weak leadership/player-coach evidence selection without regressing the current deterministic recruiter-brief contract.
- Performance recommendations distinguish changes that affect:
  - network/runtime behavior
  - retrieval/runtime overhead
  - LLM inference time
  - perceived latency in the UI
