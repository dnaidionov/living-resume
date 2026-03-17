import { fetchJobPostingFromUrl } from "@/lib/platform/url-intake";
import type { RoleInput } from "@/types/ai";

type JobPostingFetcher = typeof fetchJobPostingFromUrl;

export async function resolveRoleInputForAnalysis(
  roleInput: RoleInput,
  fetchPosting: JobPostingFetcher = fetchJobPostingFromUrl
): Promise<RoleInput> {
  if (roleInput.kind !== "url") {
    return roleInput;
  }

  const posting = await fetchPosting(roleInput.url);
  return {
    kind: "url",
    url: roleInput.url,
    content: posting.content,
    targetSummary: posting.targetSummary
  };
}
