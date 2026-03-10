import type { RequirementExtractionService } from "@/types/contracts";
import type { ExtractedRoleRequirement, RoleRequirementCategory, RoleRequirementPriority } from "@/types/ai";
import { extractRoleRequirementsHeuristically } from "@/lib/ai/prompting";
import { requestJsonCompletion } from "@/lib/ai/openai";

const defaultRequirementModel = process.env.OPENAI_REQUIREMENTS_MODEL
  ?? process.env.OPENAI_FIT_MODEL
  ?? process.env.OPENAI_CHAT_MODEL
  ?? "gpt-5-mini";

type RequirementExtractionResponse = {
  requirements?: Array<{
    text?: string;
    category?: RoleRequirementCategory;
    priority?: RoleRequirementPriority;
  }>;
};

export const llmRequirementExtractionService: RequirementExtractionService = {
  async extract(roleText) {
    if (!process.env.OPENAI_API_KEY) {
      return extractRoleRequirementsHeuristically(roleText);
    }

    try {
      const response = await requestJsonCompletion<RequirementExtractionResponse>({
        model: defaultRequirementModel,
        systemPrompt: buildRequirementExtractionSystemPrompt(),
        userPrompt: buildRequirementExtractionUserPrompt(roleText)
      });

      const normalized = normalizeExtractedRequirements(response.requirements);
      return normalized.length > 0 ? normalized : extractRoleRequirementsHeuristically(roleText);
    } catch {
      return extractRoleRequirementsHeuristically(roleText);
    }
  }
};

function buildRequirementExtractionSystemPrompt(): string {
  return [
    "You extract recruiter-relevant role requirements from job descriptions.",
    "Return only valid JSON.",
    "Ignore titles, locations, compensation, benefits, equal-opportunity statements, privacy text, cookies, navigation, application instructions, and ATS boilerplate.",
    "Keep only requirements, functions, expectations, and mission-alignment items that matter for evaluating candidate fit.",
    "Prefer concrete responsibilities and must-have qualifications over marketing copy.",
    "Each requirement must be concise, self-contained, and recruiter-readable."
  ].join(" ");
}

function buildRequirementExtractionUserPrompt(roleText: string): string {
  return [
    "Job description:",
    roleText,
    "",
    "Return JSON with one top-level field: requirements.",
    "requirements must be an array of up to 8 objects.",
    "Each object must contain:",
    '- text: the extracted requirement text',
    '- category: one of "requirement", "function", "expectation", "mission"',
    '- priority: one of "must_have", "important", "nice_to_have"',
    "Do not include role titles, team names, office locations, benefits, or application boilerplate."
  ].join("\n");
}

function normalizeExtractedRequirements(
  requirements: RequirementExtractionResponse["requirements"]
): ExtractedRoleRequirement[] {
  const seen = new Set<string>();

  return (requirements ?? [])
    .map((item) => ({
      text: typeof item.text === "string" ? item.text.trim().replace(/\s+/g, " ") : "",
      category: normalizeCategory(item.category),
      priority: normalizePriority(item.priority)
    }))
    .filter((item) => item.text.length >= 20)
    .filter((item) => !looksLikeLocationOrTitle(item.text))
    .filter((item) => {
      const key = item.text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function normalizeCategory(value: string | undefined): RoleRequirementCategory {
  return value === "requirement" || value === "function" || value === "expectation" || value === "mission"
    ? value
    : "requirement";
}

function normalizePriority(value: string | undefined): RoleRequirementPriority {
  return value === "must_have" || value === "important" || value === "nice_to_have" ? value : "important";
}

function looksLikeLocationOrTitle(text: string): boolean {
  const normalized = text.trim();
  const wordCount = normalized.split(/\s+/).length;

  if (wordCount <= 8 && !/(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|analy|align|strategy|road-?map|requirements|mission|goal|bring|technical|responsible)/i.test(normalized)) {
    return /(manager|director|lead|engineer|architect|analyst|principal|senior|staff|head|specialist|owner)/i.test(normalized);
  }

  return /\b(remote|hybrid|onsite|on-site|united states|usa|city|country|region)\b/i.test(normalized);
}
