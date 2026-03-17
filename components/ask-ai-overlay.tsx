"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import { extractFitCheckTarget, isAffirmativeFitHandoffReply, isNegativeFitHandoffReply, type FitCheckTarget } from "@/lib/chat-handoff";
import { normalizeChatText } from "@/lib/chat-format";
import type { ChatAnswer } from "@/types/ai";
import { PaperPlaneIcon } from "@/components/paper-plane-icon";
import type { FitAnalysisPrefill } from "@/components/fit-analysis-form";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  kind?: "fit_handoff";
};

const starterPrompts = [
  "What kind of AI-native product work is Dmitry strongest at?",
  "Which experience best proves product strategy and execution together?",
  "Where is the strongest evidence of LLM orchestration work?",
  "What role and company context would fit Dmitry best?"
] as const;

const storageKey = "living-resume:chat-overlay:v1";
const sessionStorageKey = "living-resume:chat-session-id";
const urlPattern = /(https?:\/\/[^\s)]+)/g;

function splitTrailingPunctuation(value: string) {
  const trimmed = value.match(/[.,!?:;]+$/);
  if (!trimmed) {
    return { url: value, trailing: "" };
  }

  return {
    url: value.slice(0, -trimmed[0].length),
    trailing: trimmed[0]
  };
}

function renderMessageContent(text: string) {
  const parts = text.split(urlPattern);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (/^https?:\/\//.test(part)) {
      const { url, trailing } = splitTrailingPunctuation(part);
      return (
        <span key={`${part}-${index}`}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)", textDecoration: "underline" }}
          >
            {url}
          </a>
          {trailing}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function AskAiOverlay({
  onClose,
  onStartFitCheck
}: {
  onClose: () => void;
  onStartFitCheck: (prefill: Omit<FitAnalysisPrefill, "id">) => void;
}) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingFitRequest, setPendingFitRequest] = useState<FitCheckTarget | null>(null);
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
      setMessages(
        parsed.slice(-20).map((item) => ({
          ...item,
          text: normalizeChatText(item.text)
        }))
      );
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

  const focusComposer = useCallback(() => {
    if (!textareaRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    focusComposer();
  }, [focusComposer]);

  useEffect(() => {
    if (loading) {
      return;
    }

    focusComposer();
  }, [focusComposer, messages, loading]);

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

  function clearFitHandoffPrompt() {
    setMessages((current) => current.map((item) => (item.kind === "fit_handoff" ? { ...item, kind: undefined } : item)));
  }

  function handleFitHandoffAccept() {
    if (!pendingFitRequest) {
      return;
    }

    clearFitHandoffPrompt();
    onStartFitCheck(
      pendingFitRequest.kind === "url"
        ? { kind: "url", value: pendingFitRequest.value }
        : { kind: "text", value: pendingFitRequest.value }
    );
    setPendingFitRequest(null);
    setMessage("");
    onClose();
  }

  function handleFitHandoffDecline() {
    clearFitHandoffPrompt();
    setMessages((current) => [
      ...current.map((item) => (item.kind === "fit_handoff" ? { ...item, kind: undefined } : item)),
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Ok, staying here."
      }
    ]);
    setPendingFitRequest(null);
    setMessage("");
  }

  async function sendMessage(input: string) {
    const trimmed = input.trim();
    if (!trimmed || loading) {
      return;
    }

    if (pendingFitRequest) {
      const normalized = normalizeChatText(trimmed);

      if (isAffirmativeFitHandoffReply(normalized)) {
        handleFitHandoffAccept();
        return;
      }

      if (isNegativeFitHandoffReply(normalized)) {
        handleFitHandoffDecline();
        return;
      }
    }

    const fitCheckTarget = extractFitCheckTarget(trimmed);
    if (fitCheckTarget) {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: normalizeChatText(trimmed)
      };

      setMessages((current) => [
        ...current,
        userMessage,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "There’s a separate fit-check flow for that. Do you want me to take you there?",
          kind: "fit_handoff"
        }
      ]);
      setPendingFitRequest(fitCheckTarget);
      setMessage("");
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: normalizeChatText(trimmed)
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
          text: normalizeChatText(payload.answer)
        }
      ]);
    } catch (caughtError) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: normalizeChatText(caughtError instanceof Error ? caughtError.message : "Something went wrong.")
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
              Chat with my Career Twin
            </h2>
            <p className="muted section-intro" style={{ marginTop: 0, marginBottom: 0 }}>
              Ask about experience, role fit, product judgment, or how this system was built.
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
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: "8px 2px 12px"
          }}
        >
          <div
            style={{
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              justifyContent: "flex-end"
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  alignSelf: "flex-start",
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
                  alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "min(760px, 86%)",
                  padding: "10px 14px",
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: item.role === "user" ? "var(--accent-soft)" : "var(--surface-alt)",
                  whiteSpace: "pre-wrap"
                }}
              >
                <div>{item.role === "assistant" ? renderMessageContent(item.text) : item.text}</div>
                {item.kind === "fit_handoff" ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ minWidth: 0, padding: "6px 12px", minHeight: 34, fontSize: "0.84rem" }}
                      onClick={() => {
                        handleFitHandoffAccept();
                      }}
                    >
                      Sure, let’s go
                    </button>
                    <button
                      type="button"
                      className="button secondary"
                      style={{ minWidth: 0, padding: "6px 12px", minHeight: 34, fontSize: "0.84rem" }}
                      onClick={() => {
                        handleFitHandoffDecline();
                      }}
                    >
                      No, stay here
                    </button>
                  </div>
                ) : null}
              </div>
            ))}

            {loading ? (
              <div
                style={{
                  alignSelf: "flex-start"
                }}
                aria-label="Assistant is typing"
              >
                <div className="typing-indicator" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  void sendMessage(message);
                }
              }}
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
