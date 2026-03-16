# Product Requirements Document

## Objective

Build a recruiter-first Career Twin that acts as a grounded, interactive professional twin. The product should let recruiters and hiring teams review Dmitry's documented experience, ask grounded questions, run candid role-fit analysis, and inspect how the Career Twin itself was built.

## Core user problems

- Recruiters need fast, trustworthy signals about fit.
- Traditional resumes hide the context behind high-level claims.
- Portfolios rarely show how someone thinks or ships AI-native products.

## Core experiences

1. Chat-first homepage
2. Resume with `View AI Context` on every role
3. Dedicated role-fit workflow from text, upload, or URL
4. Public build/process section with source visibility
5. Contact handoff

## Shipped capabilities

- The hero remains personal and centered on Dmitry rather than the product taxonomy.
- System-facing surfaces use `Career Twin` naming rather than `Living Resume`.
- Resume chat shows answer text only; it does not render visible source/proof rows.
- Resume chat supports multiline input and sends on `Cmd+Enter` (macOS) or `Ctrl+Enter` (Windows/Linux).
- Resume chat keeps the composer focused on open and after replies so the user does not need extra clicks while the overlay is open.
- Resume chat uses a compact typing-dots indicator instead of a loading bubble.
- Resume chat must politely decline off-scope personal questions and steer back to documented professional history and listed projects.
- Resume-fit requests raised inside chat must be handed off to the dedicated Role Fit section instead of being answered in chat.
- The fit-check handoff must present explicit actions:
  - `Sure, let's go`
  - `No, stay here`
- Accepting the handoff must close chat, scroll to the fit-analysis section, prefill the correct input mode (`Paste text` or `Use URL`), and auto-submit the analysis.
- Declining the handoff must stay local to the client and reply `Ok, staying here.` without sending the message through the LLM.
- Questions such as `how is this system built`, `how is this site built`, or `how is this built` must be interpreted as questions about the Career Twin product and its implementation.
- Build/process answers should end with a short invitation to see the source and documentation on GitHub.
- Visible chat answers should not expose raw evidence markers such as `Evidence 1` or `Evidence 2`.
- Build/process answers should normalize visible product naming to `Career Twin` even if older internal source material still uses `Living Resume`.
- Assistant-rendered URLs in the chat overlay should be clickable so GitHub/source-doc suggestions are directly usable.
- Trailing punctuation next to assistant-rendered URLs should stay outside the clickable link target.
- Fit analysis accepts pasted job descriptions, uploaded files, and job URLs.
- URL-based fit analysis is protected by a live external regression fixture stored in `tests/fixtures/url-fit-analysis-cases.json`; the required build-gate set currently covers Waymo, Sourgum, Motive, and Netflix product-role URLs.
- The fixture format is intentionally editable without code changes and stores URL, expected title, expected company, optional expected outcome, and enable/build-gate flags.
- Expected fit outcome mismatches are treated as QA warnings, but failure to ingest, parse, or analyze the required live URLs is a build blocker.
- Recruiter-facing fit output is a deterministic brief rather than freeform model copy.
- Fit analysis should render only the strongest 3 to 5 recruiter-facing bullets with grounded support.
- Clearly non-product roles should be screened out even when tools or domain terms overlap.
- The user-facing fit surface is qualification-first and candid, not ideal-role-first or flattering by default.

## MVP scope

- Grounded chat without visible citations in the overlay
- Structured AI context explainers
- Dedicated fit-analysis workflow from pasted text, uploaded files, or job URLs
- Deterministic recruiter-brief output with grounded evidence selection
- Chat handoff into fit analysis instead of in-chat pseudo-analysis
- Repo-managed content system
- Cloudflare-compatible deployment setup
- Public documentation of process and architecture, plus GitHub source visibility
- Seed the live URL-eval fixture with additional non-product exploratory cases so QA can expand gating later without changing the harness; current seeded disabled cases cover software engineering, QA, sales, and customer support roles

## Planned enhancements

- Continue refining experience and AI-context coverage so broader qualifications such as integrations, data analysis, databases, GTM, training, and cost estimation are represented and retrievable when supported by evidence.
- Document and prioritize deployed-performance improvements, especially LLM response-time optimizations.
- Continue refining deterministic evidence selection for recruiter-facing fit bullets while keeping the LLM limited to synthesis/recommendation tasks.
- Continue tightening fit-analysis ranking so leadership, player-coach, and strategic-execution requirements consistently pick the strongest available support.
- Decide whether remaining internal references to `Living Resume` should be renamed in prompts, docs, and internal artifacts for full terminology consistency.

Detailed cross-agent ownership for these items lives in [cross-agent-plan-2026-03-10.md](../agents/cross-agent-plan-2026-03-10.md).

## Non-goals

- Accounts
- Persistent memory
- Paid database infra in v1
- Fully autonomous agents
