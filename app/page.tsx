import { HomePageShell } from "@/components/home-page-shell";
import { loadBuildDocs, loadExplainers, loadRoles } from "@/lib/content/store";

export default async function HomePage() {
  const [roles, explainers, buildDocs] = await Promise.all([
    loadRoles(),
    loadExplainers(),
    loadBuildDocs()
  ]);

  return <HomePageShell roles={roles} explainers={explainers} buildDocs={buildDocs} />;
}
