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

test("hero presents the Credly badge with accessible verification fallback", () => {
  assert.match(heroSource, /src=\{credential\.embedUrl\}/);
  assert.match(heroSource, /<iframe/);
  assert.match(heroSource, /width=\{150\}/);
  assert.match(heroSource, /height=\{270\}/);
  assert.match(heroSource, /title=\{`View verified/);
  assert.match(heroSource, /href=\{credential\.verificationUrl\}/);
  assert.doesNotMatch(heroSource, /embed\.js|thumbnail-frame|loading="lazy"/);
  assert.match(heroSource, /formatCredentialDate\(credential\.completedDate\)/);
  assert.match(heroSource, /credential.embedUrl \? \(/);
  assert.match(heroSource, /trackEvent\("credential_clicked", \{ credential: credential\.id, surface: "hero" \}\)/);
  assert.doesNotMatch(heroSource, /expirationDate|expired|expires/i);
});

test("home page tracks GitHub clicks and passes ask-ai entry points through to the overlay", () => {
  assert.match(homePageSource, /trackEvent\("github_clicked", \{ surface: "how_built" \}\)/);
  assert.match(homePageSource, /<SiteHeader onAskAi=\{\(entryPoint\) => openChat\(entryPoint\)\} \/>/);
  assert.match(
    homePageSource,
    /credential=\{credentials\.find\(\(credential\) => credential\.featured\) \?\? null\}/
  );
});


test("Credly iframe retains its full height when mobile layout stacks vertically", () => {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const embed = css.match(/\.hero-credential__embed\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(embed, /width: 150px/);
  assert.match(embed, /height: 270px/);
  assert.match(embed, /flex: none/);
  assert.doesNotMatch(embed, /flex: 0 0 150px/);
  assert.match(css, /@media \(max-width: 560px\)[\s\S]*?\.hero-credential\s*\{[^}]*flex-direction: column/);
});
