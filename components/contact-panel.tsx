export function ContactPanel() {
  return (
    <section id="contact" className="section shell">
      <div
        className="card"
        style={{
          padding: 28,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center"
        }}
      >
        <div>
          <span className="eyebrow">Next Step</span>
          <h2 className="section-title" style={{ marginBottom: 8 }}>
            If the fit looks strong, continue the conversation.
          </h2>
          <p className="muted section-intro" style={{ margin: 0 }}>
            Use this site as the starting point, then move into a live discussion with the relevant context
            already in hand.
          </p>
        </div>
        <a className="button primary-accent" href="mailto:dmitry@example.com?subject=Living%20Resume%20Conversation">
          Contact Dmitry
        </a>
      </div>
    </section>
  );
}
