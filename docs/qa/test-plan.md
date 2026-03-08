# Test Plan

## Functional

- Homepage renders
- Resume roles render
- Every role opens AI context
- Chat route returns grounded answer plus citations
- Chat route accepts short conversation history without server-side persistence
- Fit-analysis route returns structured output from text, URL, and file inputs
- PDF and DOCX uploads parse into readable role text
- Build page renders documented process artifacts

## Quality

- AI context stays aligned with source role content
- Citations point to actual content records
- Fit output remains candid and penalizes unsupported requirements
- Fallback behavior remains usable when `OPENAI_API_KEY` is missing

## Operational

- Cloudflare and Vercel deployment paths remain documented
- Cloudflare adapter build produces `.open-next/worker.js` before release
- Logs avoid raw JD and uploaded-document content
- Analytics events remain lightweight
- Runtime dependencies remain compatible with both target hosts
