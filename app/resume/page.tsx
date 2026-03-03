import { ContentSection } from "@/components/content-section";
import { ContactPanel } from "@/components/contact-panel";
import { RoleCard } from "@/components/role-card";
import { SiteHeader } from "@/components/site-header";
import { loadExplainers, loadRoles } from "@/lib/content/store";

export default async function ResumePage() {
  const [roles, explainers] = await Promise.all([loadRoles(), loadExplainers()]);

  return (
    <main>
      <SiteHeader />
      <ContentSection
        eyebrow="Resume"
        title="Experience with inspectable context"
        intro="Each role includes a structured explainer that shows how the headline claims were achieved."
      >
        <div className="grid">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              explainer={explainers.find((item) => item.roleId === role.id) ?? null}
            />
          ))}
        </div>
      </ContentSection>
      <ContactPanel />
    </main>
  );
}
