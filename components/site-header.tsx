const links = [
  { href: "#experience", label: "Experience" },
  { href: "#fit-check", label: "Fit Check" },
  { href: "#how-built", label: "How this is built" }
];

export function SiteHeader({ onAskAi }: { onAskAi?: () => void }) {
  return (
    <header className="shell sticky-header" style={{ padding: "20px 0 8px" }}>
      <div
        className="card menu-bar"
        style={{ backdropFilter: "blur(14px)", background: "rgba(19, 29, 35, 0.84)" }}
      >
        <a href="#" style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "var(--font-sans)" }}>
          Dmitry Naidionov
        </a>
        <nav className="menu-nav">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="menu-link">
              {link.label}
            </a>
          ))}
          {onAskAi ? (
            <button type="button" className="menu-cta" onClick={onAskAi}>
              Ask AI
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
