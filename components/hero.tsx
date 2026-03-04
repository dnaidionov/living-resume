export function Hero({ onAskAi }: { onAskAi: () => void }) {
  return (
    <section className="section shell" style={{ paddingTop: 36 }}>
      <div className="grid two-col" style={{ alignItems: "stretch" }}>
        <div className="card" style={{ padding: 32, background: "linear-gradient(180deg, rgba(19,29,35,0.96), rgba(16,27,32,0.96))" }}>
          <span className="eyebrow">Living Resume</span>
          <h1 className="hero-title">
            An AI-native digital twin for recruiters and collaborators.
          </h1>
          <p className="muted hero-copy">
            Ask about resume fit, product judgment, execution style, AI system design, or how specific
            achievements were actually delivered. Every major role includes structured AI context showing
            situation, approach, and outcomes.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24, alignItems: "stretch" }}>
            <a href="#experience" className="button secondary">
              Review experience
            </a>
            <a href="#fit-check" className="button secondary">
              Run fit check
            </a>
            <button type="button" className="button primary-accent" onClick={onAskAi}>
              Ask AI
            </button>
          </div>
          <div className="pill-row" style={{ marginTop: 24 }}>
            <span className="pill">Grounded citations</span>
            <span className="pill">Role-fit analysis</span>
            <span className="pill">View AI Context</span>
            <span className="pill">Public build docs</span>
          </div>
        </div>
        <aside className="card" style={{ padding: 28, background: "var(--surface-alt)" }}>
          <span className="eyebrow">Reading Guide</span>
          <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
            {[
              "Start with Experience if you want to inspect how resume claims were actually achieved.",
              "Use Fit Check if you already have a role in mind and want a candid match read.",
              "Use How this is built if you want evidence of AI-native product thinking.",
              "Use Ask AI when you want the fastest path through the material."
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
