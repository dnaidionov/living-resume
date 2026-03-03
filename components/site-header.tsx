import Link from "next/link";

const links = [
  { href: "/resume", label: "Resume" },
  { href: "/projects", label: "Projects" },
  { href: "/build", label: "Build" }
];

export function SiteHeader() {
  return (
    <header className="shell" style={{ padding: "20px 0 8px" }}>
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        <Link href="/" style={{ fontSize: "1.15rem", fontWeight: 700 }}>
          Dmitry Naidionov
        </Link>
        <nav style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="muted">
              {link.label}
            </Link>
          ))}
          <a href="#contact" className="button secondary">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
