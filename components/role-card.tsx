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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const projectContexts = explainer?.projectContexts ?? [];
  const hasProjectContexts = projectContexts.length > 0;
  const hasMultipleProjectContexts = projectContexts.length > 1;
  const activeProjectContext =
    projectContexts.find((item) => item.id === activeProjectId) ?? projectContexts[0] ?? null;
  const hasAiContext = Boolean(explainer) && (hasProjectContexts || Boolean(explainer?.summary));

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

      {hasAiContext ? (
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
            {open ? "Hide AI Context" : "View AI Context"}
            <span aria-hidden="true" style={{ marginLeft: 4 }}>
              {open ? "⌃" : "⌄"}
            </span>
          </button>
        </div>
      ) : null}

      {explainer ? (
        <div
          style={{
            display: "grid",
            gridTemplateRows: open ? "1fr" : "0fr",
            opacity: open ? 1 : 0,
            transform: open ? "translateY(0)" : "translateY(-8px)",
            marginTop: open ? 16 : 0,
            transition:
              "grid-template-rows 360ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, transform 360ms cubic-bezier(0.22, 1, 0.36, 1), margin-top 360ms cubic-bezier(0.22, 1, 0.36, 1)",
            pointerEvents: open ? "auto" : "none"
          }}
          aria-hidden={!open}
        >
          <div style={{ overflow: "hidden" }}>
            <div
              id={`ai-context-${role.id}`}
              role="region"
              aria-label={`AI Context for ${role.title} at ${role.company}`}
              style={{
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
              {explainer.summary ? <p className="muted">{explainer.summary}</p> : null}
              {hasProjectContexts ? (
                <div>
                  {hasMultipleProjectContexts ? (
                    <div
                      role="tablist"
                      aria-label={`AI context projects for ${role.title} at ${role.company}`}
                      className="pill-row"
                      style={{ marginBottom: 14 }}
                    >
                      {projectContexts.map((item) => {
                        const isActive = (activeProjectContext?.id ?? "") === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="tab"
                            id={`ai-context-tab-${role.id}-${item.id}`}
                            aria-selected={isActive}
                            aria-controls={`ai-context-panel-${role.id}-${item.id}`}
                            onClick={() => setActiveProjectId(item.id)}
                            className="pill"
                            style={{
                              cursor: "pointer",
                              background: isActive ? "var(--surface-alt)" : "transparent",
                              borderColor: isActive ? "var(--accent)" : "var(--line)",
                              color: isActive ? "var(--text)" : "var(--text-muted)"
                            }}
                          >
                            {item.title}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {(hasMultipleProjectContexts ? [activeProjectContext] : projectContexts).map((item, index) =>
                    item ? (
                      <div
                        key={item.id}
                        role={hasMultipleProjectContexts ? "tabpanel" : undefined}
                        id={`ai-context-panel-${role.id}-${item.id}`}
                        aria-labelledby={`ai-context-tab-${role.id}-${item.id}`}
                        hidden={hasMultipleProjectContexts && item.id !== activeProjectContext?.id}
                        style={{
                          paddingTop: index === 0 ? 0 : 16,
                          marginTop: index === 0 ? 0 : 16,
                          borderTop: index === 0 ? "none" : "1px solid var(--line)"
                        }}
                      >
                        <h4 style={{ marginTop: 0, marginBottom: 8 }}>{item.title}</h4>

                        <h5 style={{ marginTop: 0, marginBottom: 4 }}>Situation</h5>
                        <p className="muted" style={{ marginTop: 0, marginBottom: 10 }}>
                          {item.situation}
                        </p>

                        <h5 style={{ marginTop: 0, marginBottom: 4 }}>Approach</h5>
                        <p className="muted" style={{ marginTop: 0, marginBottom: 10 }}>
                          {item.approach}
                        </p>

                        <h5 style={{ marginTop: 0, marginBottom: 4 }}>Work</h5>
                        <p className="muted" style={{ marginTop: 0, marginBottom: item.lessonsLearned ? 10 : 0 }}>
                          {item.work}
                        </p>

                        {item.lessonsLearned ? (
                          <>
                            <h5 style={{ marginTop: 0, marginBottom: 4 }}>Lessons Learned</h5>
                            <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
                              {item.lessonsLearned}
                            </p>
                          </>
                        ) : null}
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div>
                  {[
                    ["Situation", explainer.situation],
                    ["Goal", explainer.goal],
                    ["Constraints", explainer.constraints.join(" ")],
                    ["Approach", explainer.approach.join(" ")],
                    ["Key decisions", explainer.keyDecisions.join(" ")],
                    ["Execution", explainer.execution.join(" ")],
                    ["Outcomes", explainer.outcomes.join(" ")],
                    ["Metrics", explainer.metrics.join(" ")]
                  ].map(([label, value], index) => (
                    <div
                      key={label}
                      style={{
                        paddingTop: index === 0 ? 0 : 12,
                        marginTop: index === 0 ? 0 : 12,
                        borderTop: index === 0 ? "none" : "1px solid var(--line)"
                      }}
                    >
                      <h5 style={{ marginTop: 0, marginBottom: 4 }}>{label}</h5>
                      <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
