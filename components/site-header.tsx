"use client";

import { useEffect, useState } from "react";
import { SparkleIcon } from "@/components/sparkle-icon";
import { DownloadIcon } from "@/components/download-icon";

const links = [
  { href: "#experience", label: "Experience" },
  { href: "#fit-check", label: "Fit Check" },
  { href: "#how-built", label: "How this is built" }
];

export function SiteHeader({ onAskAi }: { onAskAi?: () => void }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 0);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky-header ${isScrolled ? "scrolled" : ""}`}>
      <div className="menu-bar">
        <a
          href="#"
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
            fontFamily: 'Georgia, "Times New Roman", serif'
          }}
        >
          DN
        </a>
        <nav className="menu-nav">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="menu-link">
              {link.label}
            </a>
          ))}
          <span className="callout-anchor">
            <a
              href="/DmitryNaidionov-cv.pdf"
              download="DmitryNaidionov-cv.pdf"
              className="menu-link menu-download-button"
              aria-label="Download classic resume"
            >
              <DownloadIcon />
            </a>
            <span className="callout-bubble">Download classic resume</span>
          </span>
          {onAskAi ? (
            <button type="button" className="menu-cta" onClick={onAskAi}>
              <SparkleIcon size={28} />
              Ask AI
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
