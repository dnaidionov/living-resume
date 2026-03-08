import type { ChatMode, FitAnalysisResult, FitDimension } from "@/types/ai";
import type { Citation, EvidenceChunk } from "@/types/content";

const dimensionOrder: FitDimension["name"][] = [
  "core_match",
  "execution_scope",
  "leadership_collaboration",
  "context_readiness"
];

type RequirementPriority = "must_have" | "important" | "nice_to_have";

type ExtractedRequirement = {
  label: string;
  priority: RequirementPriority;
};

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
    "Your goal is top-of-funnel qualification screening, not ideal-role matching.",
    "Prioritize whether the evidence shows Dmitry can perform the role's core work.",
    "Treat transferable product, strategy, execution, and cross-functional leadership evidence as valid support.",
    "Do not penalize the role for not mentioning AI or Dmitry's preferred domains unless those are explicit job requirements.",
    "Penalize unsupported must-have requirements and clear scope mismatches.",
    "Use gaps as validation points for interview follow-up, not as premature rejection language.",
    "Differentiate proven evidence, adjacent evidence, and unsupported requirements.",
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
  const requirements = extractRoleRequirements(roleText);

  return [
    "Job description or role brief:",
    roleText,
    "",
    "Extracted requirement view:",
    formatRequirements(requirements),
    "",
    "Retrieved evidence:",
    formatEvidencePacket(evidence),
    "",
    "Scoring policy:",
    "- Evaluate qualification for the role's core work before specialization alignment.",
    "- Context readiness should be secondary unless domain or technical context is explicitly required.",
    "- A role that does not mention AI should not be treated as lower fit for that reason alone.",
    "- Lower the score only for unsupported must-haves, real scope mismatches, or clearly missing required context.",
    "",
    "Return JSON with these top-level fields:",
    "overallSummary, overallScore, dimensions, strengths, gaps, transferableAdvantages, interviewAngles, confidence.",
    "dimensions must include core_match, execution_scope, leadership_collaboration, context_readiness.",
    "Each dimension must contain name, score, rationale, evidence.",
    "scores for dimensions must be integers from 1 to 5.",
    "overallScore must be an integer from 1 to 10.",
    "confidence must be one of high, medium, low.",
    "strengths, gaps, transferableAdvantages, and interviewAngles should each contain 2 to 4 concise strings.",
    "dimension evidence must cite evidence titles from the retrieved evidence list.",
    "gaps should be phrased as validation points, not disqualifying language."
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
  const requirements = extractRoleRequirements(roleText);
  const mustHaveCount = requirements.filter((item) => item.priority === "must_have").length;
  const importantCount = requirements.filter((item) => item.priority === "important").length;
  const evidenceStrength = Math.min(3, evidence.length);
  const overallScore = Math.min(9, Math.max(5, 5 + evidenceStrength + Math.min(2, mustHaveCount) + (importantCount > 0 ? 1 : 0)));

  return normalizeFitAnalysisResult(
    {
      overallSummary:
        "The evidence indicates strong qualification for this role's core product, execution, and cross-functional demands. The main interview focus should be validating the most role-specific context requirements rather than questioning baseline fit.",
      overallScore,
      dimensions: [
        {
          name: "core_match",
          score: evidence.length >= 3 ? 5 : 4,
          rationale:
            "The retrieved evidence supports the central product, strategy, and ownership responsibilities implied by the role.",
          evidence: evidence.slice(0, 3).map((item) => item.title)
        },
        {
          name: "execution_scope",
          score: evidence.length >= 3 ? 4 : 3,
          rationale:
            "The corpus shows repeated evidence of turning ambiguity into shipped outcomes, measurable impact, and structured delivery across multiple contexts.",
          evidence: evidence.slice(0, 3).map((item) => item.title)
        },
        {
          name: "leadership_collaboration",
          score: evidence.length >= 2 ? 4 : 3,
          rationale:
            "Leadership evidence centers on cross-functional alignment, stakeholder framing, and decision-making rather than formal org-management scale.",
          evidence: evidence.slice(0, 2).map((item) => item.title)
        },
        {
          name: "context_readiness",
          score: requirements.some((item) => item.priority === "must_have") ? 3 : 4,
          rationale:
            "The evidence suggests solid readiness for the role's operating context, with any highly specific domain or technical requirements best validated directly in interview.",
          evidence: evidence.slice(0, 2).map((item) => item.title)
        }
      ],
      strengths: [
        "Strong evidence of product ownership under ambiguity.",
        "Repeatable execution across strategy, delivery, and stakeholder alignment.",
        "Transferable operating range across multiple domains and product contexts."
      ],
      gaps: [
        "Validate any must-have domain context that is unusually specific to this role.",
        "Confirm the exact leadership scope if the role expects larger org-management responsibility."
      ],
      transferableAdvantages: [
        "Can connect product decisions, architecture, and delivery into one operating model.",
        "Can translate ambiguity into structured execution with measurable outcomes."
      ],
      interviewAngles: [
        "Ask for examples of roadmap ownership under ambiguity.",
        "Validate the most role-specific domain requirement directly.",
        "Probe how cross-functional decision tradeoffs were handled in prior roles."
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
      rationale: sanitizeText(raw?.rationale, buildDimensionFallback(name)),
      evidence: (raw?.evidence ?? []).filter((title) => sourceTitles.has(title)).slice(0, 3)
    };
  });

  return {
    overallSummary: sanitizeText(
      input?.overallSummary,
      "The evidence suggests Dmitry is qualified for the role's core work, with the main follow-up centered on validating the most role-specific requirements."
    ),
    overallScore: clampInteger(input?.overallScore, 1, 10, 6),
    dimensions,
    strengths: normalizeStringList(input?.strengths, [
      "Strong evidence of product judgment and execution.",
      "Transferable cross-functional leadership across varied environments."
    ]),
    gaps: normalizeStringList(input?.gaps, ["Validate the most role-specific requirement in interview rather than treating it as a disqualifier."]),
    transferableAdvantages: normalizeStringList(input?.transferableAdvantages, ["Can carry product, strategy, and delivery patterns across adjacent domains."]),
    interviewAngles: normalizeStringList(input?.interviewAngles, ["Use the interview to confirm the most role-specific context requirement."]),
    confidence: normalizeConfidence(input?.confidence, evidence.length >= 4 ? "high" : evidence.length >= 2 ? "medium" : "low"),
    citations,
    extractionWarnings: input?.extractionWarnings,
    metadata: {
      evaluatorVersion: input?.metadata?.evaluatorVersion ?? "v2-qualification-first",
      inputKind
    }
  };
}

export function extractRoleRequirements(roleText: string): ExtractedRequirement[] {
  const segments = roleText
    .split(/\n+|[•\-]\s+|\d+\.\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 20);

  const prioritized = segments.slice(0, 8).map((segment) => ({
    label: segment.replace(/\s+/g, " "),
    priority: inferRequirementPriority(segment)
  }));

  if (prioritized.length > 0) {
    return prioritized;
  }

  return [
    {
      label: roleText.slice(0, 180).replace(/\s+/g, " ").trim(),
      priority: "important" as const
    }
  ].filter((item) => item.label.length > 0);
}

function inferRequirementPriority(segment: string): RequirementPriority {
  const normalized = segment.toLowerCase();
  if (/(must|required|requirement|need to|needs to|minimum|proven|hands-on)/.test(normalized)) {
    return "must_have";
  }
  if (/(preferred|nice to have|bonus|plus|ideally)/.test(normalized)) {
    return "nice_to_have";
  }
  return "important";
}

function formatRequirements(requirements: ExtractedRequirement[]): string {
  return requirements.map((item, index) => `${index + 1}. [${item.priority}] ${item.label}`).join("\n");
}

function buildDimensionFallback(name: FitDimension["name"]): string {
  switch (name) {
    case "core_match":
      return "Core qualification should focus on whether the evidence supports the role's main product and ownership responsibilities.";
    case "execution_scope":
      return "Execution scope should focus on shipping, delivery complexity, and operating under ambiguity.";
    case "leadership_collaboration":
      return "Leadership and collaboration should focus on stakeholder alignment, decision-making, and cross-functional influence.";
    case "context_readiness":
      return "Context readiness should evaluate domain or technical specificity only where the role makes it materially important.";
  }
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
