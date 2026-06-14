import { HomePageShell } from "@/components/home-page-shell";
import { loadBuildDocs, loadCredentials, loadExplainers, loadProjects, loadRoles } from "@/lib/content/store";

export default async function HomePage() {
  const [roles, explainers, buildDocs, projects, credentials] = await Promise.all([
    loadRoles(),
    loadExplainers(),
    loadBuildDocs(),
    loadProjects(),
    loadCredentials()
  ]);

  return (
    <HomePageShell
      roles={roles}
      explainers={explainers}
      buildDocs={buildDocs}
      projects={projects}
      credentials={credentials}
    />
  );
}
