import { HomePageShell } from "@/components/home-page-shell";
import { loadBuildDocs, loadExplainers, loadProjects, loadRoles } from "@/lib/content/store";

export default async function HomePage() {
  const [roles, explainers, buildDocs, projects] = await Promise.all([
    loadRoles(),
    loadExplainers(),
    loadBuildDocs(),
    loadProjects()
  ]);

  return <HomePageShell roles={roles} explainers={explainers} buildDocs={buildDocs} projects={projects} />;
}
