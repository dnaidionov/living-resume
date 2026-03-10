# Product Requirements Document

## Objective

Build a recruiter-first living resume that acts as a grounded digital twin. The product should answer questions about Dmitry's resume, explain how specific claims were achieved, evaluate fit against a job description, and document the build itself as an AI-native case study.

## Core user problems

- Recruiters need fast, trustworthy signals about fit.
- Traditional resumes hide the context behind high-level claims.
- Portfolios rarely show how someone thinks or ships AI-native products.

## Core experiences

1. Chat-first homepage
2. Resume with `View AI Context` on every role
3. Role-fit analysis from text, upload, or URL
4. Public build/process section
5. Contact handoff

## MVP scope

- Grounded chat with citations
- Structured AI context explainers
- Heuristic fit analysis flow with scorecard
- Repo-managed content system
- Cloudflare-compatible deployment setup
- Public documentation of process and architecture

## Planned enhancements

- Strengthen later-career experience framing, especially EPAM, Modus, and Cardstack, to better signal senior product strategy and leadership.
- Revise the Modus role to include Verizon cloud solution redesign work.
- Add semantic fit-result coloring for recruiter-facing assessments.
- Review and refine the chat interaction and runtime behavior.
- Review experience and AI-context coverage so broader qualifications such as integrations, data analysis, databases, GTM, training, and cost estimation are represented and retrievable when supported by evidence.
- Document and prioritize deployed-performance improvements, especially LLM response-time optimizations.

Detailed cross-agent ownership for these items lives in [cross-agent-plan-2026-03-10.md](../agents/cross-agent-plan-2026-03-10.md).

## Non-goals

- Accounts
- Persistent memory
- Paid database infra in v1
- Fully autonomous agents
