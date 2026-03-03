"use client";

import { useState } from "react";
import type { AIContextExplainer, ResumeRole } from "@/types/content";
import { trackEvent } from "@/lib/analytics/events";

export function RoleCard({
  role,
  explainer
}: {
  role: ResumeRole;
  explainer: AIContextExplainer | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className="card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>
              {role.title} · {role.company}
            </h3>
            <div className="muted">
              {role.startDate} {role.endDate ? `- ${role.endDate}` : "- Present"}
            </div>
          </div>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              setOpen(true);
              trackEvent("ai_context_viewed", { roleId: role.id });
            }}
          >
            View AI Context
          </button>
        </div>
        <p className="muted">{role.summary}</p>
        <ul>
          {role.achievements.map((achievement) => (
            <li key={achievement}>{achievement}</li>
          ))}
        </ul>
        <div className="pill-row">
          {role.skills.map((skill) => (
            <span key={skill} className="pill">
              {skill}
            </span>
          ))}
        </div>
      </article>

      {open && explainer ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(23, 19, 17, 0.42)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 10
          }}
        >
          <div className="card" style={{ width: "min(860px, 100%)", padding: 28, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
              <div>
                <span className="eyebrow">AI Context</span>
                <h3 style={{ marginBottom: 6 }}>{explainer.headline}</h3>
              </div>
              <button className="button secondary" type="button" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <p className="muted">{explainer.summary}</p>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                ["Situation", explainer.situation],
                ["Goal", explainer.goal],
                ["Constraints", explainer.constraints.join(" ")],
                ["Approach", explainer.approach.join(" ")],
                ["Key decisions", explainer.keyDecisions.join(" ")],
                ["Execution", explainer.execution.join(" ")],
                ["Outcomes", explainer.outcomes.join(" ")],
                ["Metrics", explainer.metrics.join(" ")]
              ].map(([label, value]) => (
                <div key={label} className="pill" style={{ borderRadius: 18, padding: 16 }}>
                  <strong>{label}</strong>
                  <p className="muted" style={{ marginBottom: 0 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
