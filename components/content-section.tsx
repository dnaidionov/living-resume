import type { ReactNode } from "react";

export function ContentSection({
  eyebrow,
  title,
  intro,
  children
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="section shell">
      <span className="eyebrow">{eyebrow}</span>
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      {intro ? <p className="muted">{intro}</p> : null}
      {children}
    </section>
  );
}
