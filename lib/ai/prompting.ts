import type { ChatMode, FitAnalysisResult } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";

export function buildGroundedAnswer(message: string, evidence: EvidenceChunk[], mode: ChatMode): string {
  const lead =
    mode === "build_process"
      ? "Based on the documented build artifacts, the current implementation direction is:"
      : "Based on the curated resume and project evidence, the strongest grounded answer is:";

  const evidenceLines = evidence.slice(0, 3).map((item) => `${item.title}: ${item.text}`);
  return [lead, "", ...evidenceLines, "", `Question: ${message}`].join("\n");
}

export function buildFitAnalysisSummary(roleText: string, evidence: EvidenceChunk[]): FitAnalysisResult {
  const normalized = roleText.toLowerCase();
  const scoreBase =
    ["ai", "product", "strategy", "cross-functional", "execution"].reduce((score, term) => {
      return normalized.includes(term) ? score + 1 : score;
    }, 2);

  const overallScore = Math.min(10, Math.max(4, scoreBase + evidence.length));
  const citations = evidence.slice(0, 4).map((item) => ({
    sourceId: item.id,
    title: item.title,
    section: item.section
  }));

  return {
    overallSummary:
      "The profile appears strongest for AI-native product, strategy, and execution-heavy roles. Domain-specific depth should be validated against the role details.",
    overallScore,
    dimensions: [
      {
        name: "domain",
        score: normalized.includes("ai") ? 4 : 3,
        rationale: "The evidence set shows strong AI-native product framing, with domain depth dependent on the specific market.",
        evidence: evidence.slice(0, 2).map((item) => item.title)
      },
      {
        name: "execution",
        score: 5,
        rationale: "Multiple role and explainer records emphasize translating ambiguity into executable systems and delivery structure.",
        evidence: evidence.slice(0, 3).map((item) => item.title)
      },
      {
        name: "ai_technical",
        score: normalized.includes("machine learning") || normalized.includes("ai") ? 4 : 3,
        rationale: "The corpus supports AI-system design, prompting, grounding, and evaluation, with software implementation support in the product itself.",
        evidence: evidence.slice(0, 2).map((item) => item.title)
      },
      {
        name: "leadership",
        score: 4,
        rationale: "The record shows structured cross-functional leadership and decision framing rather than people-management-heavy evidence.",
        evidence: evidence.slice(0, 2).map((item) => item.title)
      }
    ],
    strengths: [
      "Strong product framing under ambiguity.",
      "Clear AI-native systems thinking.",
      "Comfortable making tradeoffs explicit and operationalizing them."
    ],
    gaps: [
      "The corpus may not prove every domain-specific requirement in the role.",
      "Leadership evidence is strongest around coordination and execution rather than formal org management."
    ],
    transferableAdvantages: [
      "Can connect product, content, architecture, and delivery into a coherent system.",
      "Can explain tradeoffs clearly to technical and non-technical stakeholders."
    ],
    interviewAngles: [
      "Ask for concrete examples of shipping with ambiguous requirements.",
      "Ask how AI quality and grounding decisions were operationalized.",
      "Probe domain transferability if the role is in a new vertical."
    ],
    confidence: evidence.length >= 4 ? "high" : "medium",
    citations
  };
}
