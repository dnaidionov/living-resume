"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type { ChatAnswer } from "@/types/ai";
import { PaperPlaneIcon } from "@/components/paper-plane-icon";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const starterPrompts = [
  "What kind of AI-native product work is Dmitry strongest at?",
  "Which experience best proves product strategy and execution together?",
  "Where is the strongest evidence of LLM orchestration work?",
  "What role and company context would fit Dmitry best?"
] as const;

export function AskAiOverlay({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sessionId = useMemo(() => `overlay-${Date.now()}`, []);

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

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setLoading(true);
    trackEvent("chat_started", { surface: "overlay" });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId
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
          text: payload.answer
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
              {item.text}
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
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(message);
                }
              }}
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={loading || !message.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: "1px solid transparent",
                background: "var(--accent-gradient)",
                color: "#020817",
                display: "grid",
                placeItems: "center",
                padding: 0,
                lineHeight: 0,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !message.trim() ? 0.55 : 1
              }}
            >
              <PaperPlaneIcon size={30} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
