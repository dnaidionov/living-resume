import { ContentSection } from "@/components/content-section";
import { ContactPanel } from "@/components/contact-panel";
import { SiteHeader } from "@/components/site-header";
import { loadCaseStudies, loadProjects } from "@/lib/content/store";

export default async function ProjectsPage() {
  const [projects, caseStudies] = await Promise.all([loadProjects(), loadCaseStudies()]);

  return (
    <main>
      <SiteHeader />
      <ContentSection
        eyebrow="Projects"
        title="Case studies and product systems"
        intro="The project set is curated to show how product framing, architecture, and AI-native workflows connect."
      >
        <div className="grid">
          {projects.map((project) => (
            <article key={project.id} className="card" style={{ padding: 24 }}>
              <h3>{project.name}</h3>
              <p className="muted">{project.summary}</p>
              <p>
                <strong>Problem:</strong> {project.problem}
              </p>
              <p>
                <strong>Actions:</strong> {project.actions.join(" ")}
              </p>
              <p>
                <strong>Outcomes:</strong> {project.outcomes.join(" ")}
              </p>
            </article>
          ))}
        </div>
      </ContentSection>

      <ContentSection
        eyebrow="Case Studies"
        title="Build narratives"
        intro="These case studies are also indexed as retrievable evidence for the AI layer."
      >
        <div className="grid">
          {caseStudies.map((study) => (
            <article key={study.id} className="card" style={{ padding: 24 }}>
              <h3>{study.title}</h3>
              <p className="muted">{study.summary}</p>
              <p>{study.body}</p>
            </article>
          ))}
        </div>
      </ContentSection>
      <ContactPanel />
    </main>
  );
}
