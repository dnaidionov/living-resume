"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/events";

type ChatState = {
  answer: string;
  citations: { sourceId: string; title: string; section: string }[];
  confidence: string;
} | null;

export function AskAiOverlay({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("What kind of AI-native product work is Dmitry strongest at?");
  const [mode, setMode] = useState<"auto" | "resume_qa" | "build_process">("auto");
  const [state, setState] = useState<ChatState>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    trackEvent("chat_started", { mode, surface: "overlay" });

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message,
        mode,
        sessionId: "anonymous-session"
      })
    });

    const payload = (await response.json()) as ChatState;
    setState(payload);
    setLoading(false);
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Ask AI">
      <div className="card overlay-card" style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
          <div>
            <span className="eyebrow">Ask AI</span>
            <h2 className="section-title" style={{ marginBottom: 6 }}>
              Chat with the living resume
            </h2>
            <p className="muted section-intro" style={{ marginTop: 0 }}>
              Ask about experience, role fit, product judgment, or how this site was built.
            </p>
          </div>
          <button className="button secondary" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="grid two-col" style={{ alignItems: "start" }}>
          <div className="card" style={{ padding: 24, background: "var(--surface-alt)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Conversation</h3>
              <select
                aria-label="Chat mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as typeof mode)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid var(--line)",
                  background: "var(--surface-strong)",
                  color: "var(--ink)"
                }}
              >
                <option value="auto">Auto</option>
                <option value="resume_qa">Resume QA</option>
                <option value="build_process">Build / Process</option>
              </select>
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={7}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 20,
                  border: "1px solid var(--line)",
                  background: "rgba(255,255,255,0.04)",
                  color: "var(--ink)"
                }}
              />
              <button className="button primary-accent" type="submit" disabled={loading}>
                {loading ? "Thinking..." : "Ask AI"}
              </button>
            </form>

            {state ? (
              <div className="card" style={{ padding: 20, marginTop: 20, background: "var(--surface-strong)" }}>
                <p className="body-copy" style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>
                  {state.answer}
                </p>
                <p className="muted" style={{ marginBottom: 0 }}>
                  Confidence: {state.confidence}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="card" style={{ padding: 24, background: "var(--surface-alt)" }}>
            <span className="eyebrow">Evidence</span>
            <h3 style={{ marginBottom: 8 }}>What the answer used</h3>
            <p className="muted section-intro">
              The overlay keeps the same evidence-first behavior as the rest of the product.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {(state?.citations ?? []).map((citation) => (
                <div key={citation.sourceId} className="pill" style={{ borderRadius: 18, padding: 14 }}>
                  <strong>{citation.title}</strong>
                  <div className="muted">{citation.section}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
