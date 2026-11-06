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

test("hero presents a compact badge with visible certificate and issuer linked to Credly", () => {
  assert.match(heroSource, /src=\{credential\.imagePath\}/);
  assert.match(heroSource, /width=\{88\}/);
  assert.match(heroSource, /height=\{88\}/);
  assert.match(heroSource, /href=\{credential\.verificationUrl\}/);
  assert.match(heroSource, /aria-label=\{`View verified/);
  assert.match(heroSource, /alt=\{credential\.title\}/);
  assert.match(heroSource, /trackEvent\("credential_clicked", \{ credential: credential\.id, surface: "hero" \}\)/);
  assert.match(heroSource, /className="hero-credential__title">\{credential\.title\}/);
  assert.match(heroSource, /Issued by \{credential\.issuer\}/);
  assert.match(heroSource, /Verify on Credly/);
  assert.doesNotMatch(heroSource, /<iframe|embedUrl|formatCredentialDate/);
});

test("home page tracks GitHub clicks and passes ask-ai entry points through to the overlay", () => {
  assert.match(homePageSource, /trackEvent\("github_clicked", \{ surface: "how_built" \}\)/);
  assert.match(homePageSource, /<SiteHeader onAskAi=\{\(entryPoint\) => openChat\(entryPoint\)\} \/>/);
  assert.match(
    homePageSource,
    /credential=\{credentials\.find\(\(credential\) => credential\.featured\) \?\? null\}/
  );
});


test("badge stays compact without clipping or a card background", () => {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");
  const badge = css.match(/\.hero-credential__badge\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(badge, /width: 88px/);
  assert.match(badge, /height: 88px/);
  assert.match(badge, /object-fit: contain/);
  assert.doesNotMatch(css, /hero-credential__embed/);
});
