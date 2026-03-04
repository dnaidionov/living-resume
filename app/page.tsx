import { HomePageShell } from "@/components/home-page-shell";
import { loadBuildDocs, loadExplainers, loadProjects, loadRoles } from "@/lib/content/store";

export default async function HomePage() {
  const [roles, projects, explainers, buildDocs] = await Promise.all([
    loadRoles(),
    loadProjects(),
    loadExplainers(),
    loadBuildDocs()
  ]);

  return <HomePageShell roles={roles} projects={projects} explainers={explainers} buildDocs={buildDocs} />;
}
