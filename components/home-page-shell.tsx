"use client";

import { useState } from "react";
import type { AIContextExplainer, BuildDoc, ProjectBrief, ResumeRole } from "@/types/content";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { RoleCard } from "@/components/role-card";
import { FitAnalysisForm } from "@/components/fit-analysis-form";
import { ContactPanel } from "@/components/contact-panel";
import { AskAiOverlay } from "@/components/ask-ai-overlay";

export function HomePageShell({
  roles,
  projects,
  explainers,
  buildDocs
}: {
  roles: ResumeRole[];
  projects: ProjectBrief[];
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
          <h2 className="section-title">Readable proof, not just resume headlines</h2>
          <p className="muted section-intro">
            The experience section is the core of the site. Each role exposes context, decisions, and
            outcomes in a consistent, inspectable format.
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

          <div className="grid two-col" style={{ marginTop: 24 }}>
            <div className="card" style={{ padding: 24 }}>
              <span className="eyebrow">Selected Initiatives</span>
              <h3 style={{ marginBottom: 8 }}>What the experience compounds into</h3>
              <div className="grid">
                {projects.map((project) => (
                  <div key={project.id} style={{ paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
                    <strong>{project.name}</strong>
                    <p className="muted body-copy" style={{ marginBottom: 6 }}>
                      {project.summary}
                    </p>
                    <div className="pill-row">
                      {project.tags.map((tag) => (
                        <span key={tag} className="pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ padding: 24 }}>
              <span className="eyebrow">What to ask next</span>
              <h3 style={{ marginBottom: 8 }}>Conversation prompts that reveal fit faster</h3>
              <div className="grid">
                {[
                  "Which role best demonstrates AI-native product judgment?",
                  "Where is the strongest evidence for execution under ambiguity?",
                  "What type of company context fits this background best?",
                  "Which achievements should a hiring manager probe deeper?"
                ].map((item) => (
                  <div key={item} className="pill" style={{ borderRadius: 18, padding: 16 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="fit-check" className="section shell">
          <span className="eyebrow">Fit Check</span>
          <h2 className="section-title">Evaluate role fit without reading the whole site first</h2>
          <p className="muted section-intro">
            Paste a JD, upload a file, or use a job URL. The system stays candid, evidence-backed, and
            explicit about what is proven versus adjacent.
          </p>
          <FitAnalysisForm />
        </section>

        <section id="how-built" className="section shell">
          <span className="eyebrow">How This Is Built</span>
          <h2 className="section-title">The site is also the case study</h2>
          <p className="muted section-intro">
            This product is intentionally transparent about architecture, delivery workflow, and the role
            each agent played in shaping the result.
          </p>
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
