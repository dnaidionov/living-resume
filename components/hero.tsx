import Link from "next/link";

export function Hero() {
  return (
    <section className="section shell">
      <div className="grid two-col" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ padding: 32 }}>
          <span className="eyebrow">Living Resume</span>
          <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5.6rem)", lineHeight: 0.92, margin: "18px 0" }}>
            An AI-native digital twin for recruiters and collaborators.
          </h1>
          <p className="muted" style={{ fontSize: "1.1rem", maxWidth: 680 }}>
            Ask about resume fit, product judgment, execution style, AI system design, or how specific
            achievements were actually delivered. Every major role includes structured AI context showing
            situation, approach, and outcomes.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            <a href="#chat" className="button">
              Start with chat
            </a>
            <Link href="/resume" className="button secondary">
              Explore resume
            </Link>
          </div>
          <div className="pill-row" style={{ marginTop: 24 }}>
            <span className="pill">Grounded citations</span>
            <span className="pill">Role-fit analysis</span>
            <span className="pill">View AI Context</span>
            <span className="pill">Public build docs</span>
          </div>
        </div>
        <aside className="card" style={{ padding: 28 }}>
          <span className="eyebrow">Suggested Prompts</span>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            {[
              "What kind of AI-native product builder is Dmitry?",
              "Where does his strongest evidence for product execution come from?",
              "Analyze fit for a founding product lead role.",
              "How was this site designed and implemented?"
            ].map((prompt) => (
              <div key={prompt} className="pill" style={{ borderRadius: 18, padding: 16 }}>
                {prompt}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
