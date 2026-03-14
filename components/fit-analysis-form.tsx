"use client";

import { useMemo, useState, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/events";
import type {
  FitAnalysisResult,
  FitDimension,
  FitPresentationMode,
  FitVerdict,
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

const fitSemanticColors = {
  match: {
    accent: "#45D7FF",
    background: "rgba(69, 215, 255, 0.17)",
    border: "rgba(69, 215, 255, 0.28)"
  },
  neutral: {
    accent: "#F3F7FF",
    background: "rgba(243, 247, 255, 0.08)",
    border: "rgba(243, 247, 255, 0.18)"
  },
  noFit: {
    accent: "#D9B15F",
    background: "rgba(217, 177, 95, 0.19)",
    border: "rgba(217, 177, 95, 0.3)"
  }
} as const;

function getVerdictTone(verdict: FitVerdict) {
  if (verdict === "strong_fit_lets_talk") {
    return fitSemanticColors.match;
  }

  if (verdict === "probably_not_your_person") {
    return fitSemanticColors.noFit;
  }

  return fitSemanticColors.neutral;
}

function CheckIcon({ color = "currentColor", size = 18 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3.75 9.3 7.05 12.6 14.25 4.8" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon({ color = "currentColor", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function CircleIcon({ color = "currentColor", size = 14 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function WarningTriangleIcon({ color = "currentColor", size = 16 }: { color?: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 2.2 13.2 12.8H2.8L8 2.2Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 5.7v3.5M8 11.4h.01" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SectionCaption({ children }: { children: ReactNode }) {
  return (
    <strong
      style={{
        color: "#7f8ca0",
        fontSize: "0.72rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase"
      }}
    >
      {children}
    </strong>
  );
}

function BulletCard({
  heading,
  bulletHeadings,
  body,
  color,
  icon,
  bulletIcon
}: {
  heading?: string;
  bulletHeadings?: string[];
  body: string;
  color: string;
  icon: ReactNode;
  bulletIcon?: ReactNode;
}) {
  return (
    <div
      className="pill"
      style={{
        display: "grid",
        gap: 8,
        borderRadius: 18,
        padding: 16,
        borderWidth: 0.8,
        borderStyle: "solid",
        borderColor: color === fitSemanticColors.neutral.accent ? fitSemanticColors.neutral.border : color,
        background: "rgba(255, 255, 255, 0.02)"
      }}
    >
      <div style={{ display: "grid", gap: 8 }}>
        {bulletHeadings && bulletHeadings.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {bulletHeadings.map((bulletHeading) => (
              <div key={bulletHeading} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 18,
                    minWidth: 18,
                    marginTop: 2
                  }}
                >
                  {bulletIcon ?? icon}
                </span>
                <strong style={{ color }}>{bulletHeading}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 18,
                minWidth: 18,
                marginTop: 2
              }}
            >
              {icon}
            </span>
            <strong style={{ color }}>{heading}</strong>
          </div>
        )}
        <div className="muted">{body}</div>
      </div>
    </div>
  );
}

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
  render,
  color,
  icon
}: {
  items: T[];
  render: (item: T) => { heading: string; body: string };
  color: string;
  icon: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, index) => {
        const content = render(item);
        return <BulletCard key={`${content.heading}-${index}`} heading={content.heading} body={content.body} color={color} icon={icon} />;
      })}
    </div>
  );
}

function MatchSection({ items, color }: { items: MatchBullet[]; color: string }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item, index) => (
        <BulletCard
          key={`${item.requirement}-${index}`}
          heading={item.requirement}
          bulletHeadings={item.relatedRequirements && item.relatedRequirements.length > 1 ? item.relatedRequirements : undefined}
          body={item.support}
          color={color}
          icon={<CheckIcon color={color} />}
          bulletIcon={<CheckIcon color={color} />}
        />
      ))}
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
    <div className="card" style={{ marginTop: 24, padding: 28, background: "var(--surface-alt)" }}>
      <div style={{ display: "grid", gap: 0 }}>
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
        {result ? (
          <div
            style={{
              marginTop: 28,
              paddingTop: 28,
              borderTop: "1px solid var(--line)"
            }}
          >
            {renderPresentation(result.presentation)}
          </div>
        ) : null}
      </div>
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

  const verdictTone = getVerdictTone(presentation.overallMatch.verdict);
  const verdictIcon =
    presentation.overallMatch.verdict === "probably_not_your_person" ? (
      <WarningTriangleIcon color={verdictTone.accent} />
    ) : (
      <CheckIcon color={verdictTone.accent} />
    );

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "grid",
          gap: 6,
          padding: 18,
          borderRadius: 18,
          background: verdictTone.background,
          border: `1px solid ${verdictTone.border}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            aria-hidden="true"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 999,
              border: `1px solid ${verdictTone.border}`,
              background: "rgba(255, 255, 255, 0.04)"
            }}
          >
            {verdictIcon}
          </span>
          <h3 style={{ margin: 0, fontSize: "1.45rem", color: verdictTone.accent }}>{presentation.overallMatch.label}</h3>
        </div>
      </div>

      {presentation.whereIMatch && presentation.whereIMatch.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <SectionCaption>Where I match</SectionCaption>
          <MatchSection items={presentation.whereIMatch} color={fitSemanticColors.match.accent} />
        </section>
      ) : null}

      {presentation.gapsToNote && presentation.gapsToNote.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <SectionCaption>Gaps to note</SectionCaption>
          <BulletList
            items={presentation.gapsToNote}
            render={(item: GapBullet) => ({ heading: item.requirement, body: item.gap })}
            color={fitSemanticColors.neutral.accent}
            icon={<CircleIcon color={fitSemanticColors.neutral.accent} />}
          />
        </section>
      ) : null}

      {presentation.whereIDontFit && presentation.whereIDontFit.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <SectionCaption>Where I don&apos;t fit</SectionCaption>
          <BulletList
            items={presentation.whereIDontFit}
            render={(item: GapBullet) => ({ heading: item.requirement, body: item.gap })}
            color={fitSemanticColors.noFit.accent}
            icon={<CrossIcon color={fitSemanticColors.noFit.accent} />}
          />
        </section>
      ) : null}

      {presentation.whatDoesTransfer && presentation.whatDoesTransfer.length > 0 ? (
        <section style={{ display: "grid", gap: 10 }}>
          <SectionCaption>What does transfer</SectionCaption>
          <BulletList
            items={presentation.whatDoesTransfer}
            render={(item: TransferBullet) => ({ heading: item.skillOrExperience, body: item.relevance })}
            color={fitSemanticColors.neutral.accent}
            icon={<CircleIcon color={fitSemanticColors.neutral.accent} />}
          />
        </section>
      ) : null}

      <section style={{ display: "grid", gap: 8 }}>
        <SectionCaption>My recommendation</SectionCaption>
        <p
          className="body-copy"
          style={{
            margin: 0,
            padding: 18,
            borderRadius: 18,
            background: verdictTone.background,
            border: `1px solid ${verdictTone.border}`,
            color: verdictTone.accent
          }}
        >
          {presentation.recommendation}
        </p>
      </section>
    </div>
  );
}
