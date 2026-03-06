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
        eyebrow="Experience"
        title="Professional Experience"
        intro="Chronological roles highlighting responsibilities, scope, and business outcomes."
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
