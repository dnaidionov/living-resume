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

- Use a sans-first typography stack across body and interface elements for a cleaner, enterprise-forward look.
- Adopt an EPAM-inspired visual language: dark near-black surfaces, white foreground text, cyan/purple interaction accents, and lime reserved for the highest-priority actions.
- Style highest-priority `Ask AI` CTAs with a cyan-to-violet gradient fill so they align with EPAM-style accent treatments.
- Reduce `View AI Context` button scale to avoid overpowering card headers, and add a sparkle icon to AI-trigger buttons for clearer affordance.
- Move `View AI Context` to the bottom of each role card as a borderless inline toggle that expands/collapses AI Context within the same card, with state arrow affordance.
- Refine role-card interactions with chevron state indicators, a lighter inline context panel surface, and smaller keyword pills for tighter visual hierarchy.
- Simplify hero composition by removing the Reading Guide panel and utility pills; shift hero copy to personal profile framing with a chat-icon `Ask AI About Me` CTA.
- Apply serif typography to hero name and role title while keeping body/UI sans; increase hero CTA label weight for stronger action emphasis.
- Add a secondary LinkedIn CTA in the hero actions, and simplify top-nav identity to serif initials for a cleaner header signature.
- Convert LinkedIn to an inline linked image within hero body copy, reducing CTA row noise while preserving profile discoverability.
- Rework top navigation into a full-width sticky layer that is transparent at page top and only introduces subtle background/bottom-divider separation after scroll.
- Keep the role cards and AI context modal as the strongest trust-building surfaces within the one-page flow.
- Remove the embedded inline chat section from the homepage and make chat a modal interaction initiated through `Ask AI`.
- Preserve fit analysis as a visible section because it is the strongest recruiter-specific workflow after experience review.

## Implementation notes

- The homepage becomes the primary one-page experience.
- Existing subpages can remain in the codebase, but the top-level menu should no longer route to them.
- The overlay chat should reuse the same API contract as the existing chat flow.
- Theme tokens in `app/globals.css` should remain the single source of truth for palette changes across components.
- Agent Workflow now includes a rendered Mermaid handoff diagram image generated from `docs/agents/handoffs.mmd`.
- add a GitHub logo CTA (`See it on GitHub`) to the How This Is Built section, linking directly to the repository
- reposition the GitHub CTA inline with the How This Is Built intro copy to reduce vertical footprint
- redesign Ask AI overlay into chatbot pattern: fixed header, scrollable message history, compact composer with corner send icon, clickable starter prompts, and in-session message persistence
- restore Ask AI overlay heading/subheading, convert close control to icon-only, style starter prompts as compact assistant-side chips, and implement one-line auto-growing composer (max three lines) with fixed right-side send button
- set composer send control to paper-plane icon for familiar chat affordance
- replace send icon path with a visually centered custom plane glyph, enlarge to 30px, and increase contrast using deep navy icon color on gradient send button
- update send icon to an outlined, tilted paper-plane style while preserving size and center alignment in the composer button
- add thin divider under chat header and reposition close control as larger borderless top-right icon aligned to header start line
- add icon-only top-nav resume download control with tooltip text `Download classic resume` and downloadable classic resume artifact in public/
- surface resume download in both top navigation and hero actions; replace tooltip with immediate attached hover callout (`Download classic resume`) to improve affordance clarity
- wire download controls to latest PDF resume artifact in public (`DmitryNaidionov-cv.pdf`) so clicks fetch the current classic resume file
- switch resume download glyph to file-download icon style and make hero download action icon-only (label carried by attached callout)
- align icon-only resume download controls with each section’s existing button system (menu-link in header, secondary button in hero)
- adjust hero icon-only resume download control to match surrounding action-button height/alignment (44px) while remaining icon-only
- fine-tune hero icon-only resume control baseline alignment by matching flex-row center alignment and adjusting icon visual centering/size to text-button rhythm
- remove text-file resume fallback and standardize downloads on the latest PDF resume artifact only
- apply recruiter-brief fit-result semantics with electric-cyan `Where I match`, neutral ink-white `Gaps to note`, and soft-gold `Where I don't fit`, plus matching verdict/recommendation panels and bullet icons
- collapse fit-analysis input and output into one card, remove the `Role Fit` / `Output` eyebrow pills, and reveal results inline under the form separated by a divider
