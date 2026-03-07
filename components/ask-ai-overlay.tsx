"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type { ChatAnswer } from "@/types/ai";
import { PaperPlaneIcon } from "@/components/paper-plane-icon";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: ChatAnswer["citations"];
};

const starterPrompts = [
  "What kind of AI-native product work is Dmitry strongest at?",
  "Which experience best proves product strategy and execution together?",
  "Where is the strongest evidence of LLM orchestration work?",
  "What role and company context would fit Dmitry best?"
] as const;

const storageKey = "living-resume:chat-overlay:v1";
const sessionStorageKey = "living-resume:chat-session-id";

export function AskAiOverlay({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionId = useMemo(() => {
    if (typeof window === "undefined") {
      return "overlay-session";
    }

    const existing = window.localStorage.getItem(sessionStorageKey);
    if (existing) {
      return existing;
    }

    const next = crypto.randomUUID();
    window.localStorage.setItem(sessionStorageKey, next);
    return next;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ChatMessage[];
      setMessages(parsed.slice(-20));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
  }, [messages]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (!textareaRef.current) {
      return;
    }

    const minHeight = 44;
    const maxHeight = 112;
    const input = textareaRef.current;

    input.style.height = "0px";
    const nextHeight = Math.min(Math.max(input.scrollHeight, minHeight), maxHeight);
    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [message]);

  async function sendMessage(input: string) {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setMessage("");
    setLoading(true);
    trackEvent("chat_started", { surface: "overlay" });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          history: nextMessages.slice(-8).map((item) => ({
            role: item.role,
            text: item.text
          }))
        })
      });

      const payload = (await response.json()) as ChatAnswer & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to get response.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: payload.answer,
          citations: payload.citations
        }
      ]);
    } catch (caughtError) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: caughtError instanceof Error ? caughtError.message : "Something went wrong."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await sendMessage(message);
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Ask AI">
      <div
        className="card overlay-card"
        style={{
          padding: 18,
          height: "min(88vh, 840px)",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "relative",
            paddingBottom: 12,
            borderBottom: "1px solid rgba(243, 247, 255, 0.1)"
          }}
        >
          <div>
            <span className="eyebrow">Ask AI</span>
            <h2 className="section-title" style={{ marginBottom: 6 }}>
              Chat with the living resume
            </h2>
            <p className="muted section-intro" style={{ marginTop: 0, marginBottom: 0 }}>
              Ask about experience, role fit, product judgment, or how this site was built.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 42,
              height: 42,
              border: "none",
              background: "transparent",
              color: "var(--muted)",
              fontSize: "1.75rem",
              lineHeight: 1,
              display: "grid",
              placeItems: "center",
              cursor: "pointer"
            }}
          >
            ×
          </button>
        </div>

        <div
          ref={scrollRef}
          style={{
            overflowY: "auto",
            padding: "8px 2px 12px",
            display: "grid",
            gap: 10
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                justifySelf: "start",
                maxWidth: "min(760px, 86%)",
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "var(--surface-alt)"
              }}
            >
              <p className="muted" style={{ margin: 0, marginBottom: 8 }}>
                Try one of these:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    style={{
                      border: "1px solid var(--line)",
                      background: "rgba(255,255,255,0.03)",
                      color: "var(--ink)",
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: "0.84rem",
                      lineHeight: 1.2,
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      void sendMessage(prompt);
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((item) => (
            <div
              key={item.id}
              style={{
                justifySelf: item.role === "user" ? "end" : "start",
                maxWidth: "min(760px, 86%)",
                padding: "10px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: item.role === "user" ? "var(--accent-soft)" : "var(--surface-alt)",
                whiteSpace: "pre-wrap"
              }}
            >
              <div>{item.text}</div>
              {item.citations && item.citations.length > 0 ? (
                <div style={{ display: "grid", gap: 4, marginTop: 10 }}>
                  {item.citations.map((citation) => (
                    <div key={`${item.id}-${citation.sourceId}`} className="muted" style={{ fontSize: "0.8rem" }}>
                      {citation.title} · {citation.section}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}

          {loading ? (
            <div
              style={{
                justifySelf: "start",
                padding: "8px 12px",
                borderRadius: 12,
                border: "1px solid var(--line)",
                background: "var(--surface-alt)"
              }}
            >
              Thinking...
            </div>
          ) : null}
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={1}
              placeholder="Message..."
              style={{
                flex: 1,
                minHeight: 44,
                maxHeight: 112,
                padding: "11px 14px",
                borderRadius: 14,
                border: "1px solid var(--line)",
                background: "rgba(8, 12, 18, 0.72)",
                color: "var(--ink)",
                resize: "none"
              }}
            />
            <button className="button primary-accent" type="submit" disabled={loading || !message.trim()}>
              <PaperPlaneIcon />
              <span style={{ marginLeft: 8 }}>{loading ? "Sending" : "Send"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
