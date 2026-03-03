import { ChatShell } from "@/components/chat-shell";
import { ContactPanel } from "@/components/contact-panel";
import { FitAnalysisForm } from "@/components/fit-analysis-form";
import { Hero } from "@/components/hero";
import { ContentSection } from "@/components/content-section";
import { SiteHeader } from "@/components/site-header";
import { loadProjects, loadRoles } from "@/lib/content/store";

export default async function HomePage() {
  const [roles, projects] = await Promise.all([loadRoles(), loadProjects()]);

  return (
    <main>
      <SiteHeader />
      <Hero />
      <ChatShell />
      <FitAnalysisForm />

      <ContentSection
        eyebrow="Snapshot"
        title="What this system surfaces quickly"
        intro="The homepage stays recruiter-first: enough proof to orient the conversation without forcing someone to read the whole site first."
      >
        <div className="grid two-col">
          <div className="card" style={{ padding: 24 }}>
            <h3>Representative roles</h3>
            {roles.map((role) => (
              <div key={role.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                <strong>{role.title}</strong>
                <div className="muted">{role.company}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3>Selected initiatives</h3>
            {projects.map((project) => (
              <div key={project.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
                <strong>{project.name}</strong>
                <div className="muted">{project.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </ContentSection>

      <ContactPanel />
    </main>
  );
}
