# Experience Designer Review

## Objective

Polish the living-resume UI so it reads as a coherent recruiter-facing product rather than an early scaffold.

## Requirements

- Make the typographic scale more readable by reducing oversized jumps between headings, body copy, and supporting UI text.
- Use sans-serif fonts in the sticky header and navigation controls.
- Align primary and secondary buttons so action rows feel deliberate rather than uneven.
- Add hover behavior to buttons so a border appears on hover and disappears on unhover.
- Shift the overall visual system to a darker palette while keeping readability high.
- Make the main navigation sticky.
- Replace the menu labels with:
  - `Experience`
  - `Fit Check`
  - `How this is built`
  - `Ask AI`
- Treat all menu items except `Ask AI` as regular action buttons with hover affordances.
- Treat `Ask AI` as the highlighted navigation action.
- Convert the main experience into a one-page site.
- Make menu items except `Ask AI` scroll to sections on the same page.
- Make `Ask AI` open a chat overlay.
- Blur the background slightly while the chat overlay is open.

## Design decisions

- Keep serif typography for the body and major editorial copy, but move the navigation and UI controls to sans-serif for sharper hierarchy.
- Use a dark slate palette with warm gold accents instead of the original light-paper palette.
- Keep the role cards and AI context modal as the strongest trust-building surfaces within the one-page flow.
- Remove the embedded inline chat section from the homepage and make chat a modal interaction initiated through `Ask AI`.
- Preserve fit analysis as a visible section because it is the strongest recruiter-specific workflow after experience review.

## Implementation notes

- The homepage becomes the primary one-page experience.
- Existing subpages can remain in the codebase, but the top-level menu should no longer route to them.
- The overlay chat should reuse the same API contract as the existing chat flow.
