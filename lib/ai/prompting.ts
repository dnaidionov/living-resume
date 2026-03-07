import type { ChatMode, FitAnalysisResult, FitDimension } from "@/types/ai";
import type { Citation, EvidenceChunk } from "@/types/content";

const dimensionOrder: FitDimension["name"][] = ["domain", "execution", "ai_technical", "leadership"];

function formatEvidenceChunk(item: EvidenceChunk, index: number): string {
  return [
    `Evidence ${index + 1}`,
    `title: ${item.title}`,
    `section: ${item.section}`,
    `sourceType: ${item.sourceType}`,
    `tags: ${item.tags.join(", ") || "none"}`,
    `text: ${item.text}`
  ].join("\n");
}

export function formatEvidencePacket(evidence: EvidenceChunk[]): string {
  if (evidence.length === 0) {
    return "No matching evidence was retrieved from the curated corpus.";
  }

  return evidence.map(formatEvidenceChunk).join("\n\n");
}

export function buildChatSystemPrompt(mode: ChatMode): string {
  const modeInstruction =
    mode === "build_process"
      ? "Answer only from build/process evidence. If the evidence is weak, say that directly."
      : "Answer only from resume, project, FAQ, and AI-context evidence. If the evidence is weak, say that directly.";

  return [
    "You are the AI systems architect for Dmitry Naidionov's living resume.",
    modeInstruction,
    "Be concise, direct, and grounded.",
    "Do not fabricate facts, employers, metrics, or technologies.",
    "If evidence is partial, distinguish proven evidence from adjacent evidence.",
    "Do not mention citations inline unless they materially clarify uncertainty.",
    "Return plain text only."
  ].join(" ");
}

export function buildFitAnalysisSystemPrompt(): string {
  return [
    "You evaluate role fit for Dmitry Naidionov using only curated evidence retrieved from the resume corpus.",
    "Be candid. Penalize missing or weakly-supported requirements.",
    "Differentiate proven evidence, adjacent evidence, and unsupported requirements.",
    "Execution and leadership must not default to fixed scores.",
    "Return valid JSON only with the requested fields."
  ].join(" ");
}

export function buildChatUserPrompt(message: string, evidence: EvidenceChunk[]): string {
  return [
    "Question:",
    message,
    "",
    "Retrieved evidence:",
    formatEvidencePacket(evidence),
    "",
    "Answer the question using this evidence only."
  ].join("\n");
}

export function buildFitAnalysisUserPrompt(roleText: string, evidence: EvidenceChunk[]): string {
  return [
    "Job description or role brief:",
    roleText,
    "",
    "Retrieved evidence:",
    formatEvidencePacket(evidence),
    "",
    "Return JSON with these top-level fields:",
    "overallSummary, overallScore, dimensions, strengths, gaps, transferableAdvantages, interviewAngles, confidence.",
    "dimensions must include domain, execution, ai_technical, leadership.",
    "Each dimension must contain name, score, rationale, evidence.",
    "scores for dimensions must be integers from 1 to 5.",
    "overallScore must be an integer from 1 to 10.",
    "confidence must be one of high, medium, low.",
    "strengths, gaps, transferableAdvantages, and interviewAngles should each contain 2 to 4 concise strings.",
    "dimension evidence must cite evidence titles from the retrieved evidence list."
  ].join("\n");
}

export function buildFallbackChatAnswer(message: string, evidence: EvidenceChunk[], mode: ChatMode): string {
  if (evidence.length === 0) {
    return mode === "build_process"
      ? "I do not see enough build evidence to answer that yet."
      : "I do not see enough resume or project evidence to answer that yet.";
  }

  const opening =
    mode === "build_process"
      ? "The strongest documented build evidence points to:"
      : "The strongest documented evidence for that question points to:";

  const bullets = evidence.slice(0, 3).map((item) => `- ${item.title}: ${item.text}`);

  return [opening, ...bullets, "", `Question reviewed: ${message}`].join("\n");
}

export function buildFallbackFitAnalysisSummary(roleText: string, evidence: EvidenceChunk[]): FitAnalysisResult {
  const normalized = roleText.toLowerCase();
  const scoreBase = ["ai", "product", "strategy", "execution", "leadership"].reduce((score, term) => {
    return normalized.includes(term) ? score + 1 : score;
  }, 2);

  const overallScore = Math.min(10, Math.max(4, scoreBase + Math.min(evidence.length, 4)));
  const citations = buildCitations(evidence);

  return normalizeFitAnalysisResult(
    {
      overallSummary:
        "The profile appears strongest for AI-native product and execution-heavy roles, with domain-specific depth and leadership scope requiring validation against the job description.",
      overallScore,
      dimensions: [
        {
          name: "domain",
          score: normalized.includes("ai") ? 4 : 3,
          rationale: "Domain fit is strongest where AI-native product strategy, developer experience, or regulated product contexts overlap with the role.",
          evidence: evidence.slice(0, 2).map((item) => item.title)
        },
        {
          name: "execution",
          score: evidence.length >= 3 ? 4 : 3,
          rationale: "The corpus shows repeated evidence of turning ambiguity into shipped product work, but execution strength should still be validated against the exact role scope.",
          evidence: evidence.slice(0, 3).map((item) => item.title)
        },
        {
          name: "ai_technical",
          score: normalized.includes("machine learning") || normalized.includes("ai") ? 4 : 3,
          rationale: "The corpus supports AI-system design, prompting, grounding, and evaluation, though not every role requires the same technical depth.",
          evidence: evidence.slice(0, 2).map((item) => item.title)
        },
        {
          name: "leadership",
          score: evidence.length >= 2 ? 4 : 3,
          rationale: "Leadership evidence centers on structured cross-functional leadership and decision framing more than large-org people management.",
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
        "Leadership evidence is stronger around delivery and cross-functional alignment than formal people management."
      ],
      transferableAdvantages: [
        "Can connect product, content, architecture, and delivery into a coherent system.",
        "Can explain tradeoffs clearly to technical and non-technical stakeholders."
      ],
      interviewAngles: [
        "Ask for concrete examples of shipping with ambiguous requirements.",
        "Probe domain transferability if the role is in a new vertical.",
        "Ask how AI quality and grounding decisions were operationalized."
      ],
      confidence: evidence.length >= 4 ? "high" : evidence.length >= 2 ? "medium" : "low"
    },
    evidence,
    "text"
  );
}

export function buildCitations(evidence: EvidenceChunk[]): Citation[] {
  return evidence.slice(0, 4).map((item) => ({
    sourceId: item.id,
    title: item.title,
    section: item.section
  }));
}

export function normalizeFitAnalysisResult(
  input: Partial<FitAnalysisResult> | null | undefined,
  evidence: EvidenceChunk[],
  inputKind: "text" | "url" | "file"
): FitAnalysisResult {
  const citations = buildCitations(evidence);
  const sourceTitles = new Set(evidence.map((item) => item.title));
  const dimensions = dimensionOrder.map((name) => {
    const raw = input?.dimensions?.find((dimension) => dimension.name === name);
    return {
      name,
      score: clampInteger(raw?.score, 1, 5, 3),
      rationale: sanitizeText(raw?.rationale, `${name} fit requires further validation against the retrieved evidence.`),
      evidence: (raw?.evidence ?? []).filter((title) => sourceTitles.has(title)).slice(0, 3)
    };
  });

  return {
    overallSummary: sanitizeText(
      input?.overallSummary,
      "The fit looks directionally promising, but the retrieved evidence does not fully prove every requirement yet."
    ),
    overallScore: clampInteger(input?.overallScore, 1, 10, 5),
    dimensions,
    strengths: normalizeStringList(input?.strengths, ["Strong product and systems framing.", "Evidence-backed execution across multiple contexts."]),
    gaps: normalizeStringList(input?.gaps, ["Some role-specific requirements may need direct validation."]),
    transferableAdvantages: normalizeStringList(input?.transferableAdvantages, ["Can connect product decisions, architecture, and delivery into one operating model."]),
    interviewAngles: normalizeStringList(input?.interviewAngles, ["Ask for concrete examples that validate the most critical requirements."]),
    confidence: normalizeConfidence(input?.confidence, evidence.length >= 4 ? "high" : evidence.length >= 2 ? "medium" : "low"),
    citations,
    extractionWarnings: input?.extractionWarnings,
    metadata: {
      evaluatorVersion: input?.metadata?.evaluatorVersion ?? "v2-llm",
      inputKind
    }
  };
}

function normalizeStringList(values: string[] | undefined, fallback: string[]): string[] {
  const normalized = (values ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 4);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeConfidence(value: string | undefined, fallback: FitAnalysisResult["confidence"]): FitAnalysisResult["confidence"] {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function sanitizeText(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function clampInteger(value: number | undefined, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
