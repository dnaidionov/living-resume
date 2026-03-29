import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const headerSource = readFileSync(path.join(process.cwd(), "components/site-header.tsx"), "utf8");
const heroSource = readFileSync(path.join(process.cwd(), "components/hero.tsx"), "utf8");
const homePageSource = readFileSync(path.join(process.cwd(), "components/home-page-shell.tsx"), "utf8");

test("site header tracks resume downloads", () => {
  assert.match(headerSource, /trackEvent\("resume_downloaded", \{ surface: "header" \}\)/);
});

test("hero tracks linkedin clicks, resume downloads, and ask-ai entry point", () => {
  assert.match(heroSource, /trackEvent\("linkedin_clicked", \{ surface: "hero" \}\)/);
  assert.match(heroSource, /trackEvent\("resume_downloaded", \{ surface: "hero" \}\)/);
  assert.match(heroSource, /onAskAi\("hero_cta"\)/);
});

test("home page tracks GitHub clicks and passes ask-ai entry points through to the overlay", () => {
  assert.match(homePageSource, /trackEvent\("github_clicked", \{ surface: "how_built" \}\)/);
  assert.match(homePageSource, /<SiteHeader onAskAi=\{\(entryPoint\) => openChat\(entryPoint\)\} \/>/);
  assert.match(homePageSource, /<Hero onAskAi=\{\(entryPoint\) => openChat\(entryPoint\)\} \/>/);
});
