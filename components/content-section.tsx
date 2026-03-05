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
      <h2 className="section-title">{title}</h2>
      {intro ? <p className="muted section-intro">{intro}</p> : null}
      {children}
    </section>
  );
}
