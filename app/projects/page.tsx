import { ContentSection } from "@/components/content-section";
import { ContactPanel } from "@/components/contact-panel";
import { SiteHeader } from "@/components/site-header";
import { loadProjects } from "@/lib/content/store";

export default async function ProjectsPage() {
  const projects = await loadProjects();

  return (
    <main>
      <SiteHeader />
      <ContentSection
        eyebrow="Projects"
        title="Selected Projects"
        intro="A mix of product systems and independent builds that show how I frame problems, shape systems, and make things real."
      >
        <div className="grid">
          {projects.map((project) => (
            <article key={project.id} className="card" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap"
                }}
              >
                <h3 style={{ marginBottom: 0 }}>{project.name}</h3>
                {project.link ? (
                  <a href={project.link} target="_blank" rel="noreferrer" className="menu-link">
                    Source
                  </a>
                ) : null}
              </div>
              <p className="muted">{project.summary}</p>
              {project.projectType === "product_system" ? (
                <>
                  {project.context ? (
                    <p>
                      <strong>What it solves:</strong> {project.context}
                    </p>
                  ) : null}
                  {project.build ? (
                    <p>
                      <strong>What I built:</strong> {project.build}
                    </p>
                  ) : null}
                  {project.keyDecisions && project.keyDecisions.length > 0 ? (
                    <div>
                      <strong>Key decisions:</strong>
                      <ul style={{ marginTop: 12, paddingLeft: 20 }}>
                        {project.keyDecisions.map((decision) => (
                          <li key={decision} style={{ marginBottom: 8 }}>
                            {decision}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {project.significance ? (
                    <p>
                      <strong>Why it matters:</strong> {project.significance}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  {project.why ? (
                    <p>
                      <strong>Why I made it:</strong> {project.why}
                    </p>
                  ) : null}
                </>
              )}
              <p>
                <strong>Status:</strong> {project.status}
              </p>
            </article>
          ))}
        </div>
      </ContentSection>
      <ContactPanel />
    </main>
  );
}
