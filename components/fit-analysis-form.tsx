"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type { FitAnalysisResult } from "@/types/ai";

export function FitAnalysisForm() {
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FitAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "url" | "file">("text");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    trackEvent("fit_analysis_started");

    try {
      let response: Response;

      if (inputMode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sessionId", "anonymous-session");

        response = await fetch("/api/fit-analysis/file", {
          method: "POST",
          body: formData
        });
      } else {
        response = await fetch("/api/fit-analysis", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            roleInput:
              inputMode === "url"
                ? {
                    kind: "url",
                    url: jobUrl
                  }
                : {
                    kind: "text",
                    text: jobText
                  },
            sessionId: "anonymous-session"
          })
        });
      }

      const payload = (await response.json()) as FitAnalysisResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to analyze role.");
      }

      setResult(payload);
      trackEvent("fit_analysis_completed");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to analyze role.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="grid two-col" style={{ marginTop: 24 }}>
        <div className="card" style={{ padding: 28, background: "var(--surface-alt)" }}>
          <span className="eyebrow">Role Fit</span>
          <h3 style={{ marginBottom: 8, fontSize: "1.5rem" }}>Run a candid fit analysis</h3>
          <p className="muted body-copy">
            Paste a job description and the system will map the role against curated resume and project
            evidence.
          </p>
          <div className="pill-row" style={{ marginTop: 18 }}>
            {[
              ["text", "Paste text"],
              ["url", "Use URL"],
              ["file", "Upload file"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`button ${inputMode === value ? "primary-accent" : "secondary"}`}
                onClick={() => setInputMode(value as typeof inputMode)}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, marginTop: 18 }}>
            {inputMode === "text" ? (
              <textarea
                rows={9}
                value={jobText}
                onChange={(event) => setJobText(event.target.value)}
                placeholder="Paste a role description here..."
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 20,
                  border: "1px solid var(--line)",
                  background: "rgba(8, 12, 18, 0.72)",
                  color: "var(--ink)"
                }}
              />
            ) : null}
            {inputMode === "url" ? (
              <input
                type="url"
                value={jobUrl}
                onChange={(event) => setJobUrl(event.target.value)}
                placeholder="Paste a job URL from a careers page or ATS..."
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 20,
                  border: "1px solid var(--line)",
                  background: "rgba(8, 12, 18, 0.72)",
                  color: "var(--ink)"
                }}
              />
            ) : null}
            {inputMode === "file" ? (
              <input
                type="file"
                accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            ) : null}
            {error ? <p style={{ color: "var(--accent)", margin: 0 }}>{error}</p> : null}
            <button
              className="button primary-accent"
              type="submit"
              disabled={
                loading ||
                (inputMode === "text" && !jobText.trim()) ||
                (inputMode === "url" && !jobUrl.trim()) ||
                (inputMode === "file" && !file)
              }
            >
              {loading ? "Analyzing..." : "Analyze fit"}
            </button>
          </form>
        </div>

        <aside className="card" style={{ padding: 28, background: "var(--surface-alt)" }}>
          <span className="eyebrow">Output</span>
          {result ? (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <h3 style={{ marginBottom: 4, fontSize: "1.45rem" }}>Overall score: {result.overallScore}/10</h3>
                <p className="muted body-copy" style={{ marginTop: 0 }}>
                  {result.overallSummary}
                </p>
              </div>
              {result.dimensions.map((dimension) => (
                <div key={dimension.name} className="pill" style={{ borderRadius: 18, padding: 14 }}>
                  <strong>
                    {dimension.name}: {dimension.score}/5
                  </strong>
                  <div className="muted">{dimension.rationale}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">The scorecard, strengths, gaps, and interview angles appear here.</p>
          )}
        </aside>
      </div>
  );
}
