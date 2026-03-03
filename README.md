# Living Resume

Recruiter-first digital twin and living resume built as an AI-native product showcase.

## What is in this repo

- `app/`: Next.js application surfaces and API routes.
- `components/`: UI primitives and page sections.
- `content/`: Resume, projects, AI context explainers, FAQ, and public build docs.
- `lib/`: Content, retrieval, AI, analytics, logging, and platform abstractions.
- `docs/`: PRD, architecture, ADRs, agent handoffs, QA, and operations docs.
- `scripts/`: Content indexing and embeddings generation scripts.
- `tests/`: Repository-level tests for content and retrieval contracts.

## Product intent

The site is designed to:

- answer grounded questions about Dmitry's resume and work,
- explain how claims were achieved through structured `View AI Context` explainers,
- evaluate fit against pasted, uploaded, or linked job descriptions,
- document the build itself as a public AI-native case study.

## Stack

- `Next.js` App Router
- `TypeScript`
- `Cloudflare Pages + Workers`
- `OpenAI` via provider abstraction
- repo-managed content and static retrieval artifacts

## Local workflow

```bash
npm install
npm run content:build
npm run embeddings:build
npm run dev
```

## Deployment target

The app is structured for a Cloudflare deployment path using OpenNext-compatible output and Worker runtime boundaries. Details live in [deployment-cloudflare-openai.md](docs/architecture/deployment-cloudflare-openai.md).

## Documentation map

- [PRD](docs/product/prd.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Agent Roster](docs/agents/roster.md)
- [Runbook](docs/operations/runbook.md)
