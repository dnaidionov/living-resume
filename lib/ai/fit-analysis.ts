import type { FitAnalysisService } from "@/types/contracts";
import type { ExtractedRoleRequirement, FitPresentationMode, RoleInput } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { generateFitAnalysisWithOpenAI } from "@/lib/ai/openai";
import { llmRequirementExtractionService } from "@/lib/ai/requirement-extraction";

function roleInputToText(input: RoleInput): string {
  if (input.kind === "text") {
    return input.text;
  }
  if (input.kind === "url") {
    return input.content ?? input.url;
  }
  return `${input.fileId} ${input.mimeType}`;
}

function fitRequirementPriority(requirement: ExtractedRoleRequirement): number {
  const priorityScore =
    requirement.priority === "must_have" ? 30 : requirement.priority === "important" ? 20 : 10;
  const categoryScore =
    requirement.category === "requirement"
      ? 12
      : requirement.category === "function"
        ? 10
        : requirement.category === "expectation"
          ? 8
          : 4;
  return priorityScore + categoryScore;
}

export function buildFitAnalysisQueries(roleText: string, requirements: ExtractedRoleRequirement[]): string[] {
  const prioritizedRequirements = [...requirements]
    .sort((left, right) => fitRequirementPriority(right) - fitRequirementPriority(left))
    .slice(0, 6)
    .map((item) => item.text.trim())
    .filter(Boolean);

  return Array.from(new Set([roleText.trim(), ...prioritizedRequirements].filter(Boolean)));
}

export async function resolveFitAnalysisEvidence(
  roleText: string,
  requirements: ExtractedRoleRequirement[]
): Promise<EvidenceChunk[]> {
  const queries = buildFitAnalysisQueries(roleText, requirements);
  const results = await Promise.all(
    queries.map(async (query, queryIndex) => ({
      queryIndex,
      chunks: await staticRetrievalStore.searchEvidence(query, "fit_analysis")
    }))
  );

  const scored = new Map<string, { chunk: EvidenceChunk; score: number; bestQueryIndex: number; bestRank: number }>();

  for (const result of results) {
    for (const [rank, chunk] of result.chunks.entries()) {
      const scoreContribution = (result.queryIndex === 0 ? 12 : 18) - rank;
      const existing = scored.get(chunk.id);
      if (!existing) {
        scored.set(chunk.id, {
          chunk,
          score: scoreContribution,
          bestQueryIndex: result.queryIndex,
          bestRank: rank
        });
        continue;
      }

      existing.score += scoreContribution;
      if (
        result.queryIndex < existing.bestQueryIndex ||
        (result.queryIndex === existing.bestQueryIndex && rank < existing.bestRank)
      ) {
        existing.bestQueryIndex = result.queryIndex;
        existing.bestRank = rank;
      }
    }
  }

  return Array.from(scored.values())
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (left.bestQueryIndex !== right.bestQueryIndex) {
        return left.bestQueryIndex - right.bestQueryIndex;
      }
      return left.bestRank - right.bestRank;
    })
    .slice(0, 12)
    .map(({ chunk }) => chunk);
}

export const heuristicFitAnalysisService: FitAnalysisService = {
  async analyze(roleInput, _sessionId, presentationMode = "recruiter_brief") {
    const roleText = roleInputToText(roleInput);
    const requirements = await llmRequirementExtractionService.extract(roleText);
    const evidence = await resolveFitAnalysisEvidence(roleText, requirements);
    return generateFitAnalysisWithOpenAI(roleText, requirements, evidence, roleInput.kind, presentationMode);
  }
};
