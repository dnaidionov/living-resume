"use client";

import { useState } from "react";
import Image from "next/image";
import type { AIContextExplainer, BuildDoc, ResumeRole } from "@/types/content";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { RoleCard } from "@/components/role-card";
import { FitAnalysisForm } from "@/components/fit-analysis-form";
import { ContactPanel } from "@/components/contact-panel";
import { AskAiOverlay } from "@/components/ask-ai-overlay";
import { GithubIcon } from "@/components/github-icon";

export function HomePageShell({
  roles,
  explainers,
  buildDocs
}: {
  roles: ResumeRole[];
  explainers: AIContextExplainer[];
  buildDocs: BuildDoc[];
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <main className={`page-shell ${isChatOpen ? "is-blurred" : ""}`}>
      <div className="page-shell__content">
        <SiteHeader onAskAi={() => setIsChatOpen(true)} />
        <Hero onAskAi={() => setIsChatOpen(true)} />

        <section id="experience" className="section shell">
          <span className="eyebrow">Experience</span>
          <h2 className="section-title">Professional Experience</h2>
          <p
            style={{
              marginBottom: 16,
              fontSize: "1.02rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              opacity: 0.74
            }}
          >
            Current focus: AI product management, developer experience, and cross-functional execution at
            scale.
          </p>
          <div className="grid" style={{ marginTop: 24 }}>
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                explainer={explainers.find((item) => item.roleId === role.id) ?? null}
              />
            ))}
          </div>

        </section>

        <section id="fit-check" className="section shell">
          <span className="eyebrow">Role Fit</span>
          <h2 className="section-title">Role Fit Assessment</h2>
          <p className="muted section-intro">
            Paste a job description, upload a file, or use a job URL to compare role requirements with
            documented experience and outcomes.
          </p>
          <FitAnalysisForm />
        </section>

        <section id="how-built" className="section shell">
          <span className="eyebrow">How This Is Built</span>
          <h2 className="section-title">The site is also the case study</h2>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap"
            }}
          >
            <p className="muted section-intro" style={{ margin: 0, flex: "1 1 540px" }}>
              This product is intentionally transparent about architecture, delivery workflow, and the role
              each agent played in shaping the result.
            </p>
            <a
              href="https://github.com/dnaidionov/living-resume"
              target="_blank"
              rel="noreferrer"
              className="button secondary"
              style={{ fontWeight: 600, minWidth: 0, padding: "10px 14px" }}
            >
              <GithubIcon size={18} />
              See it on GitHub
            </a>
          </div>
          <div className="grid two-col" style={{ marginTop: 24 }}>
            <div className="grid">
              {buildDocs.map((doc) => (
                <article key={doc.id} className="card" style={{ padding: 24 }}>
                  <h3 style={{ marginBottom: 8 }}>{doc.title}</h3>
                  <p className="muted body-copy">{doc.summary}</p>
                  <p className="body-copy" style={{ marginBottom: 0 }}>
                    {doc.body}
                  </p>
                </article>
              ))}
            </div>
            <div className="card" style={{ padding: 24 }}>
              <span className="eyebrow">Agent Workflow</span>
              <h3 style={{ marginBottom: 8 }}>The delivery model is documented, not implied</h3>
              <div className="card" style={{ padding: 12, marginBottom: 16, background: "var(--surface-alt)" }}>
                <Image
                  src="/agent-handoffs.svg"
                  alt="Agent handoff diagram"
                  width={1200}
                  height={900}
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
              <div className="grid">
                {[
                  "Product Architect -> scope, surface inventory, success criteria",
                  "Experience Designer -> visual system, layout, interaction rules",
                  "Content Strategist -> source corpus, voice, explainers",
                  "AI Systems Architect -> retrieval, prompts, fit rubric",
                  "Application Engineer -> app, APIs, deployment setup",
                  "QA / Evaluations Agent -> test criteria, evidence validation",
                  "Ops / Release Agent -> cost controls, logs, release readiness"
                ].map((item) => (
                  <div key={item} className="pill" style={{ borderRadius: 18, padding: 16 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ContactPanel />
      </div>

      {isChatOpen ? <AskAiOverlay onClose={() => setIsChatOpen(false)} /> : null}
    </main>
  );
}
