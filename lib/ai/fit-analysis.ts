import type { FitAnalysisService } from "@/types/contracts";
import type { ExtractedRoleRequirement, FitPresentationMode, FitTargetSummary, RoleInput } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";
import { staticRetrievalStore } from "@/lib/retrieval/store";
import { generateFitAnalysisWithOpenAI } from "@/lib/ai/openai";
import { llmRequirementExtractionService } from "@/lib/ai/requirement-extraction";

export const uploadedRoleRequirementsMissingError =
  "Uploaded file was readable, but no job description requirements could be extracted. Upload a clearer job description.";

function roleInputToText(input: RoleInput): string {
  if (input.kind === "text") {
    return input.text;
  }
  if (input.kind === "url") {
    return input.content ?? input.url;
  }
  return `${input.fileId} ${input.mimeType}`;
}

const titleKeywords = /\b(product|manager|director|lead|head|owner|principal|staff|senior|group|vp|vice president)\b/i;
const locationNoise = /\b(remote|hybrid|united states|usa|uk|europe|india|canada|germany|france|singapore|australia|new york|san francisco|seattle|london|berlin|toronto|boston|austin|los angeles)\b/i;
const structuralNoise = /^(about the role|about you|about us|responsibilities|requirements|qualifications|what you.ll do|what you will do|who you are)$/i;

function normalizeHeaderLine(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .trim();
}

function looksLikeRoleTitle(value: string): boolean {
  return value.length >= 6 && value.length <= 120 && titleKeywords.test(value) && !structuralNoise.test(value);
}

function looksLikeCompany(value: string): boolean {
  return value.length >= 2 &&
    value.length <= 80 &&
    !value.startsWith("-") &&
    !titleKeywords.test(value) &&
    !locationNoise.test(value) &&
    !/^(on site|hybrid|remote|full-time|part-time|contract|temporary|internship|product|engineering|marketing|sales)$/i.test(value) &&
    !structuralNoise.test(value) &&
    /[A-Za-z]/.test(value);
}

function extractCompanyFromIntro(lines: string[]): string | undefined {
  for (const line of lines.slice(0, 20)) {
    const match = line.match(/^([A-Z][A-Za-z0-9&.'\- ]{1,60})\s+is\s+/);
    const companyName = normalizeHeaderLine(match?.[1] ?? "");
    if (companyName && looksLikeCompany(companyName)) {
      return companyName;
    }
  }

  return undefined;
}

export function extractRoleTargetSummary(roleText: string): FitTargetSummary | undefined {
  const lines = roleText
    .split("\n")
    .map(normalizeHeaderLine)
    .filter(Boolean)
    .slice(0, 20);

  if (lines.length === 0) {
    return undefined;
  }

  const firstLine = lines[0] ?? "";
  const pipeParts = firstLine.split("|").map((part) => normalizeHeaderLine(part)).filter(Boolean);
  if (pipeParts.length >= 2) {
    const roleTitle = pipeParts.find(looksLikeRoleTitle);
    const companyName = [...pipeParts].reverse().find(looksLikeCompany);
    if (roleTitle) {
      return {
        roleTitle,
        companyName,
        displayLabel: companyName ? `${roleTitle} - ${companyName}` : roleTitle
      };
    }
  }

  const dashMatch = firstLine.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    const left = normalizeHeaderLine(dashMatch[1] ?? "");
    const right = normalizeHeaderLine(dashMatch[2] ?? "");
    if (looksLikeRoleTitle(left) && looksLikeCompany(right)) {
      return {
        roleTitle: left,
        companyName: right,
        displayLabel: `${left} - ${right}`
      };
    }
  }

  const first = lines[0];
  const second = lines[1];
  if (first && second) {
    if (looksLikeCompany(first) && looksLikeRoleTitle(second)) {
      return {
        roleTitle: second,
        companyName: first,
        displayLabel: `${second} - ${first}`
      };
    }

    if (looksLikeRoleTitle(first) && looksLikeCompany(second)) {
      return {
        roleTitle: first,
        companyName: second,
        displayLabel: `${first} - ${second}`
      };
    }
  }

  const roleTitle = lines.find(looksLikeRoleTitle);
  if (roleTitle) {
    const companyName = extractCompanyFromIntro(lines);
    return {
      roleTitle,
      companyName,
      displayLabel: companyName ? `${roleTitle} - ${companyName}` : roleTitle
    };
  }

  return undefined;
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
  const batches = await staticRetrievalStore.searchEvidenceBatch(queries, "fit_analysis");
  const results = batches.map((chunks, queryIndex) => ({
    queryIndex,
    chunks
  }));

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

type UploadedRoleAnalysisDependencies = {
  extractRequirements?: (roleText: string) => Promise<ExtractedRoleRequirement[]>;
  resolveEvidence?: (roleText: string, requirements: ExtractedRoleRequirement[]) => Promise<EvidenceChunk[]>;
  generateAnalysis?: typeof generateFitAnalysisWithOpenAI;
};

export async function analyzeUploadedRoleText(
  roleText: string,
  _sessionId: string,
  presentationMode: FitPresentationMode = "recruiter_brief",
  dependencies: UploadedRoleAnalysisDependencies = {}
) {
  const extractRequirements = dependencies.extractRequirements ?? ((input) => llmRequirementExtractionService.extract(input));
  const resolveEvidence = dependencies.resolveEvidence ?? ((input, requirements) => resolveFitAnalysisEvidence(input, requirements));
  const generateAnalysis = dependencies.generateAnalysis ?? generateFitAnalysisWithOpenAI;

  const requirements = await extractRequirements(roleText);
  if (requirements.length === 0) {
    throw new Error(uploadedRoleRequirementsMissingError);
  }

  const targetSummary = extractRoleTargetSummary(roleText);
  const evidence = await resolveEvidence(roleText, requirements);
  return generateAnalysis(roleText, requirements, evidence, "file", presentationMode, targetSummary);
}

export const heuristicFitAnalysisService: FitAnalysisService = {
  async analyze(roleInput, _sessionId, presentationMode = "recruiter_brief") {
    const roleText = roleInputToText(roleInput);
    const targetSummary = roleInput.kind === "url" && roleInput.targetSummary
      ? roleInput.targetSummary
      : extractRoleTargetSummary(roleText);
    const requirements = await llmRequirementExtractionService.extract(roleText);
    const evidence = await resolveFitAnalysisEvidence(roleText, requirements);
    return generateFitAnalysisWithOpenAI(roleText, requirements, evidence, roleInput.kind, presentationMode, targetSummary);
  }
};
