import { ContentSection } from "@/components/content-section";
import { ContactPanel } from "@/components/contact-panel";
import { SiteHeader } from "@/components/site-header";
import { loadBuildDocs } from "@/lib/content/store";

export default async function BuildPage() {
  const buildDocs = await loadBuildDocs();

  return (
    <main>
      <SiteHeader />
      <ContentSection
        eyebrow="Build"
        title="How this product was designed and delivered"
        intro="The site is intentionally public about its architecture, costs, and agent handoff model."
      >
        <div className="grid">
          {buildDocs.map((doc) => (
            <article key={doc.id} className="card" style={{ padding: 24 }}>
              <h3>{doc.title}</h3>
              <p className="muted">{doc.summary}</p>
              <p>{doc.body}</p>
            </article>
          ))}
        </div>
      </ContentSection>
      <ContentSection
        eyebrow="Delivery"
        title="Agentic team workflow"
        intro="The delivery system is organized around roles with explicit handoffs, artifacts, and acceptance criteria."
      >
        <div className="grid two-col">
          {[
            "Product Architect -> scope, success criteria, page inventory",
            "Experience Designer -> visual system, interactions, AI context behavior",
            "Content Strategist -> source files, voice, case-study structure",
            "AI Systems Architect -> retrieval, prompts, fit rubric, provider abstraction",
            "Application Engineer -> UI, APIs, content loading, deployment setup",
            "QA / Evaluations Agent -> tests, evidence checks, risk validation",
            "Ops / Release Agent -> deploy, logs, analytics, budget controls"
          ].map((item) => (
            <div key={item} className="pill" style={{ borderRadius: 18, padding: 18 }}>
              {item}
            </div>
          ))}
        </div>
      </ContentSection>
      <ContactPanel />
    </main>
  );
}
