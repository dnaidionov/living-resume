# Experience Designer Implementation Note (2026-03-05)

## Scope

This update focused on resume-download affordances and chat-overlay interaction polish.

## What was implemented

- Added resume download control in top menu and hero actions.
- Wired both controls to download the latest PDF resume (`public/DmitryNaidionov-cv.pdf`).
- Removed the legacy text fallback download artifact (`public/classic-resume.txt`) so the UI always downloads the PDF version.
- Added attached hover callout label (`Download classic resume`) with arrow pointer and immediate display.
- Tuned hero download icon control sizing/alignment to match surrounding action-row button rhythm.
- Added icon assets for download and refined callout/button styling in global CSS.

## Files touched by this agent in this update set

- `app/globals.css`
- `components/site-header.tsx`
- `components/hero.tsx`
- `components/download-icon.tsx`
- `public/DmitryNaidionov-cv.pdf`
- `docs/agents/experience-designer-review.md`
- `docs/agents/handoffs.md`
- `docs/agents/experience-designer-implementation-2026-03-05.md`
