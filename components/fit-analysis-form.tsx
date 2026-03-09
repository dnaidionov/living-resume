"use client";

import { useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type {
  FitAnalysisResult,
  FitDimension,
  FitPresentationMode,
  GapBullet,
  MatchBullet,
  RecruiterBriefPresentation,
  ScorecardPresentation,
  TransferBullet
} from "@/types/ai";

const dimensionLabels: Record<FitDimension["name"], string> = {
  core_match: "Core Match",
  execution_scope: "Execution Scope",
  leadership_collaboration: "Leadership & Collaboration",
  context_readiness: "Context Readiness"
};

function resolvePresentationMode(): FitPresentationMode {
  if (typeof window !== "undefined") {
    const mode = new URLSearchParams(window.location.search).get("fitView");
    if (mode === "scorecard" || mode === "recruiter_brief") {
      return mode;
    }
  }

  const defaultMode = process.env.NEXT_PUBLIC_FIT_PRESENTATION_MODE;
  return defaultMode === "scorecard" ? "scorecard" : "recruiter_brief";
}

function BulletList<T extends { requirement?: string; support?: string; gap?: string; skillOrExperience?: string; relevance?: string }>({
  items,
  render
}: {
  items: T[];
  render: (item: T) => { heading: string; body: string };
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, index) => {
        const content = render(item);
        return (
          <div key={`${content.heading}-${index}`} className="pill" style={{ borderRadius: 18, padding: 14 }}>
            <strong>{content.heading}</strong>
            <div className="muted" style={{ marginTop: 4 }}>
              {content.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FitAnalysisForm() {
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FitAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputMode, setInputMode] = useState<"text" | "url" | "file">("url");
  const [error, setError] = useState<string | null>(null);
  const presentationMode = useMemo(resolvePresentationMode, []);

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
        formData.append("presentationMode", presentationMode);

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
            sessionId: "anonymous-session",
            presentationMode
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
          Paste a job description and the system will judge whether the evidence shows strong qualification for the role,
          then summarize the best supporting points and any validation items for interview.
        </p>
        <div className="pill-row" style={{ marginTop: 18 }}>
          {[
            ["url", "Use URL"],
            ["text", "Paste text"],
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
        {result ? renderPresentation(result.presentation) : <p className="muted">The fit assessment will appear here.</p>}
      </aside>
    </div>
  );
}

function renderPresentation(presentation: RecruiterBriefPresentation | ScorecardPresentation) {
  if (presentation.mode === "scorecard") {
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <h3 style={{ marginBottom: 4, fontSize: "1.45rem" }}>Overall score: {presentation.overallScore}/10</h3>
          <p className="muted body-copy" style={{ marginTop: 0 }}>
            {presentation.overallSummary}
          </p>
        </div>
        {presentation.dimensions.map((dimension) => (
          <div key={dimension.name} className="pill" style={{ borderRadius: 18, padding: 14 }}>
            <strong>
              {dimensionLabels[dimension.name]}: {dimension.score}/5
            </strong>
            <div className="muted">{dimension.rationale}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div>
        <h3 style={{ marginBottom: 4, fontSize: "1.45rem" }}>Overall match: {presentation.overallMatch.label}</h3>
      </div>

      {presentation.whereIMatch && presentation.whereIMatch.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <strong>Where I match</strong>
          <BulletList items={presentation.whereIMatch} render={(item: MatchBullet) => ({ heading: item.requirement, body: item.support })} />
        </section>
      ) : null}

      {presentation.gapsToNote && presentation.gapsToNote.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <strong>Gaps to note</strong>
          <BulletList items={presentation.gapsToNote} render={(item: GapBullet) => ({ heading: item.requirement, body: item.gap })} />
        </section>
      ) : null}

      {presentation.whereIDontFit && presentation.whereIDontFit.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <strong>Where I don&apos;t fit</strong>
          <BulletList items={presentation.whereIDontFit} render={(item: GapBullet) => ({ heading: item.requirement, body: item.gap })} />
        </section>
      ) : null}

      {presentation.whatDoesTransfer && presentation.whatDoesTransfer.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <strong>What does transfer</strong>
          <BulletList items={presentation.whatDoesTransfer} render={(item: TransferBullet) => ({ heading: item.skillOrExperience, body: item.relevance })} />
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 8 }}>
        <strong>My recommendation</strong>
        <p className="muted body-copy" style={{ margin: 0 }}>
          {presentation.recommendation}
        </p>
      </section>
    </div>
  );
}
