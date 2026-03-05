"use client";

import { useState } from "react";
import type { AIContextExplainer, ResumeRole } from "@/types/content";
import { trackEvent } from "@/lib/analytics/events";
import { SparkleIcon } from "@/components/sparkle-icon";

export function RoleCard({
  role,
  explainer
}: {
  role: ResumeRole;
  explainer: AIContextExplainer | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <article className="card" style={{ padding: 24 }}>
      <div>
        <h3 style={{ marginBottom: 4 }}>
          {role.title} · {role.company}
        </h3>
        <div className="muted">
          {role.startDate} {role.endDate ? `- ${role.endDate}` : "- Present"}
        </div>
      </div>
      <p className="muted">{role.summary}</p>
      <ul>
        {role.achievements.map((achievement) => (
          <li key={achievement}>{achievement}</li>
        ))}
      </ul>
      <div className="pill-row">
        {role.skills.map((skill) => (
          <span key={skill} className="pill keyword-pill">
            {skill}
          </span>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <button
          className="button compact"
          type="button"
          style={{
            border: "none",
            background: "transparent",
            paddingLeft: 0,
            paddingRight: 0,
            color: "var(--accent)"
          }}
          onClick={() => {
            setOpen((current) => {
              const next = !current;
              if (next) {
                trackEvent("ai_context_viewed", { roleId: role.id });
              }
              return next;
            });
          }}
          aria-expanded={open}
          aria-controls={`ai-context-${role.id}`}
        >
          <SparkleIcon size={26} />
          View AI Context
          <span aria-hidden="true" style={{ marginLeft: 4 }}>
            {open ? "⌃" : "⌄"}
          </span>
        </button>
      </div>

      {open && explainer ? (
        <div
          id={`ai-context-${role.id}`}
          role="region"
          aria-label={`AI Context for ${role.title} at ${role.company}`}
          style={{
            marginTop: 16,
            border: "1px solid var(--line)",
            borderRadius: 18,
            background: "rgba(24, 34, 52, 0.95)",
            padding: 20
          }}
        >
          <div>
            <span className="eyebrow">AI Context</span>
            <h3 style={{ marginBottom: 6 }}>{explainer.headline}</h3>
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
      ) : null}
    </article>
  );
}
