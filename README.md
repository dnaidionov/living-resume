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
npm test
npm run build
npm run cf:build
npm run dev
```

## Deployment target

The app is structured for low-cost stateless deployment on Cloudflare, with portable runtime boundaries that also allow side-by-side deployment on Vercel. Details live in [deployment-cloudflare-openai.md](docs/architecture/deployment-cloudflare-openai.md) and the [operations runbook](docs/operations/runbook.md).

## Documentation map

- [PRD](docs/product/prd.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Agent Roster](docs/agents/roster.md)
- [Runbook](docs/operations/runbook.md)
