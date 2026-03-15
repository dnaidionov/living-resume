"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/events";

type ChatState = {
  answer: string;
  citations: { sourceId: string; title: string; section: string }[];
  confidence: string;
} | null;

export function ChatShell() {
  const [message, setMessage] = useState("What makes Dmitry a strong fit for AI-native product work?");
  const [mode, setMode] = useState<"auto" | "resume_qa" | "build_process">("auto");
  const [state, setState] = useState<ChatState>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    trackEvent("chat_started", { mode });

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
    <section id="chat" className="section shell">
      <div className="grid two-col">
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <span className="eyebrow">Chat</span>
              <h2 style={{ marginBottom: 4 }}>Ask the Career Twin</h2>
            </div>
            <select
              aria-label="Chat mode"
              value={mode}
              onChange={(event) => setMode(event.target.value as typeof mode)}
              style={{ padding: "10px 12px", borderRadius: 12, border: "1px solid var(--line)" }}
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
              rows={6}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 20,
                border: "1px solid var(--line)",
                background: "rgba(8, 12, 18, 0.72)",
                color: "var(--ink)"
              }}
            />
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Ask"}
            </button>
          </form>

          {state ? (
            <div className="card" style={{ padding: 20, marginTop: 20, background: "var(--surface-strong)" }}>
              <p style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>{state.answer}</p>
              <p className="muted" style={{ marginBottom: 0 }}>
                Confidence: {state.confidence}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="card" style={{ padding: 28 }}>
          <span className="eyebrow">Evidence</span>
          <h2 style={{ marginBottom: 8 }}>Citation rail</h2>
          <p className="muted">
            Answers show the source records that the system used so a recruiter can inspect whether the
            claim is grounded.
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
    </section>
  );
}
