import type {
  FitAnalysisResult,
  FitDimension,
  FitPresentationMode,
  FitVerdict,
  GapBullet,
  InternalFitEvaluation,
  MatchBullet,
  RecruiterBriefPresentation,
  ScorecardPresentation,
  TransferBullet,
  ChatMode
} from "@/types/ai";
import type { Citation, EvidenceChunk } from "@/types/content";

const dimensionOrder: FitDimension["name"][] = [
  "core_match",
  "execution_scope",
  "leadership_collaboration",
  "context_readiness"
];

type RequirementPriority = "must_have" | "important" | "nice_to_have";

type ExtractedRequirement = {
  requirement: string;
  priority: RequirementPriority;
};

type InternalFitEvaluationInput = Partial<InternalFitEvaluation> | null | undefined;

type RecruiterBriefInput = Partial<RecruiterBriefPresentation> | null | undefined;

type FitAnalysisResponseInput = Partial<FitAnalysisResult> & {
  internal?: Partial<InternalFitEvaluation>;
  presentation?: Partial<RecruiterBriefPresentation | ScorecardPresentation>;
  overallSummary?: string;
  overallScore?: number;
  dimensions?: FitDimension[];
  strengths?: string[];
  gaps?: string[];
  transferableAdvantages?: string[];
  interviewAngles?: string[];
};

export function formatEvidencePacket(evidence: EvidenceChunk[]): string {
  if (evidence.length === 0) {
    return "No matching evidence was retrieved from the curated corpus.";
  }

  return evidence
    .map((item, index) => [
      `Evidence ${index + 1}`,
      `title: ${item.title}`,
      `section: ${item.section}`,
      `sourceType: ${item.sourceType}`,
      `tags: ${item.tags.join(", ") || "none"}`,
      `text: ${item.text}`
    ].join("\n"))
    .join("\n\n");
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
    "Recruiter-facing output must never mention Dmitry's preferred domains, preferred technologies, absent AI wording, or internal scoring logic.",
    "Use gaps as validation points for interview follow-up, not as premature rejection language.",
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

export function buildFitAnalysisUserPrompt(roleText: string, evidence: EvidenceChunk[], presentationMode: FitPresentationMode): string {
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
    "Internal evaluation policy:",
    "- Evaluate qualification for the role's core work before specialization alignment.",
    "- Context readiness should be secondary unless domain or technical context is explicitly required.",
    "- A role that does not mention AI should not be treated as lower fit for that reason alone.",
    "- Lower the score only for unsupported must-haves, real scope mismatches, or clearly missing required context.",
    "",
    `Primary presentation mode: ${presentationMode}`,
    "Return JSON with these top-level fields:",
    "presentation, internal, confidence.",
    "internal must contain overallSummary, overallScore, dimensions, strengths, gaps, transferableAdvantages, interviewAngles.",
    "internal.dimensions must include core_match, execution_scope, leadership_collaboration, context_readiness.",
    "presentation.mode must be either recruiter_brief or scorecard.",
    "For recruiter_brief, return overallMatch, recommendation, and the verdict-appropriate sections.",
    "Allowed recruiter_brief labels are exactly: Strong Fit - Let's talk, Probably a Good Fit, Honest Assessment - Probably Not Your Person.",
    "For Strong Fit or Probably a Good Fit, include whereIMatch and optional gapsToNote.",
    "For Honest Assessment - Probably Not Your Person, include whereIDontFit and whatDoesTransfer.",
    "Extract up to 5 main job requirements, functions, or expectations that are a proven fit when the verdict is positive.",
    "For whereIMatch bullets, use the matched requirement as the title and the supporting evidence as the text.",
    "Supporting evidence should be a concise example of matching prior experience, outcome, result, or accomplishment, not a raw situation setup.",
    "Each bullet must reference a specific requirement and a concise support/gap explanation.",
    "Recommendation must be one paragraph, no more than 4 sentences.",
    "Recommendation should be a short call to action or fit statement, not a recap of the bullets above.",
    "Recruiter-facing text must not mention preferred domains, preferred technologies, absent AI wording, or internal scoring logic.",
    "For scorecard mode, return overallSummary, overallScore, dimensions, strengths, gaps, transferableAdvantages, interviewAngles.",
    "All scores must be integers, overallScore from 1 to 10 and dimension scores from 1 to 5.",
    "confidence must be one of high, medium, low."
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

export function buildFallbackFitAnalysisResponse(
  roleText: string,
  evidence: EvidenceChunk[],
  inputKind: "text" | "url" | "file",
  presentationMode: FitPresentationMode
): FitAnalysisResult {
  const internal = buildFallbackInternalFit(roleText, evidence);
  return assembleFitAnalysisResult({
    input: {
      internal,
      presentation: presentationMode === "recruiter_brief" ? buildRecruiterBriefFromInternal(roleText, internal, evidence) : undefined,
      confidence: evidence.length >= 4 ? "high" : evidence.length >= 2 ? "medium" : "low"
    },
    roleText,
    evidence,
    inputKind,
    presentationMode,
    evaluatorVersion: "v3-fallback"
  });
}

function buildFallbackInternalFit(roleText: string, evidence: EvidenceChunk[]): InternalFitEvaluation {
  const requirements = extractRoleRequirements(roleText);
  const mustHaveCount = requirements.filter((item) => item.priority === "must_have").length;
  const evidenceStrength = Math.min(3, evidence.length);
  const overallScore = Math.min(9, Math.max(5, 5 + evidenceStrength + Math.min(1, mustHaveCount)));

  return {
    overallSummary:
      "The evidence indicates strong qualification for this role's core product, execution, and cross-functional demands. The main interview focus should be validating the most role-specific context requirements.",
    overallScore,
    dimensions: [
      {
        name: "core_match",
        score: evidence.length >= 3 ? 5 : 4,
        rationale: "The retrieved evidence supports the central product, strategy, and ownership responsibilities implied by the role.",
        evidence: evidence.slice(0, 3).map((item) => item.title)
      },
      {
        name: "execution_scope",
        score: evidence.length >= 3 ? 4 : 3,
        rationale: "The corpus shows repeated evidence of turning ambiguity into shipped outcomes, measurable impact, and structured delivery across multiple contexts.",
        evidence: evidence.slice(0, 3).map((item) => item.title)
      },
      {
        name: "leadership_collaboration",
        score: evidence.length >= 2 ? 4 : 3,
        rationale: "The evidence supports cross-functional leadership, stakeholder framing, and decision-making across complex initiatives.",
        evidence: evidence.slice(0, 2).map((item) => item.title)
      },
      {
        name: "context_readiness",
        score: requirements.some((item) => item.priority === "must_have") ? 3 : 4,
        rationale: "The evidence suggests solid readiness for the role's operating context, with any highly specific domain or technical requirements best validated directly in interview.",
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
    ]
  };
}

export function assembleFitAnalysisResult({
  input,
  roleText,
  evidence,
  inputKind,
  presentationMode,
  evaluatorVersion
}: {
  input: FitAnalysisResponseInput | null | undefined;
  roleText: string;
  evidence: EvidenceChunk[];
  inputKind: "text" | "url" | "file";
  presentationMode: FitPresentationMode;
  evaluatorVersion: string;
}): FitAnalysisResult {
  const citations = buildCitations(evidence);
  const internalInput = input?.internal ?? pickInternalInput(input);
  const internal = normalizeInternalFitEvaluation(internalInput, evidence);
  const presentation = normalizePresentation(
    input?.presentation,
    internal,
    extractRoleRequirements(roleText),
    evidence,
    presentationMode
  );

  return {
    presentation,
    internal,
    citations,
    confidence: normalizeConfidence(input?.confidence, evidence.length >= 4 ? "high" : evidence.length >= 2 ? "medium" : "low"),
    extractionWarnings: input?.extractionWarnings,
    metadata: {
      evaluatorVersion,
      inputKind,
      presentationMode
    }
  };
}

function pickInternalInput(input: FitAnalysisResponseInput | null | undefined): InternalFitEvaluationInput {
  if (!input) {
    return undefined;
  }

  return {
    overallSummary: typeof input.overallSummary === "string" ? input.overallSummary : undefined,
    overallScore: typeof input.overallScore === "number" ? input.overallScore : undefined,
    dimensions: input.internal?.dimensions ?? input.dimensions,
    strengths: input.internal?.strengths ?? input.strengths,
    gaps: input.internal?.gaps ?? input.gaps,
    transferableAdvantages: input.internal?.transferableAdvantages ?? input.transferableAdvantages,
    interviewAngles: input.internal?.interviewAngles ?? input.interviewAngles
  };
}

export function buildCitations(evidence: EvidenceChunk[]): Citation[] {
  return evidence.slice(0, 4).map((item) => ({
    sourceId: item.id,
    title: item.title,
    section: item.section
  }));
}

export function extractRoleRequirements(roleText: string): ExtractedRequirement[] {
  const segments = roleText
    .split(/\n+|[•\-]\s+|\d+\.\s+/)
    .map((item) => item.trim())
    .map((item) => item.replace(/\s+/g, " "))
    .filter((item) => item.length >= 20)
    .filter(isLikelyRequirementSegment);

  const prioritized = dedupeRequirements(segments).slice(0, 8).map((segment) => ({
    requirement: segment,
    priority: inferRequirementPriority(segment)
  }));

  if (prioritized.length > 0) {
    return prioritized;
  }

  return [
    {
      requirement: roleText.slice(0, 180).replace(/\s+/g, " ").trim(),
      priority: "important" as const
    }
  ].filter((item) => item.requirement.length > 0);
}

function normalizeInternalFitEvaluation(input: InternalFitEvaluationInput, evidence: EvidenceChunk[]): InternalFitEvaluation {
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
    interviewAngles: normalizeStringList(input?.interviewAngles, ["Use the interview to confirm the most role-specific context requirement."])
  };
}

function normalizePresentation(
  input: RecruiterBriefInput | Partial<ScorecardPresentation> | null | undefined,
  internal: InternalFitEvaluation,
  requirements: ExtractedRequirement[],
  evidence: EvidenceChunk[],
  mode: FitPresentationMode
): RecruiterBriefPresentation | ScorecardPresentation {
  if (mode === "scorecard") {
    return {
      mode: "scorecard",
      overallSummary: internal.overallSummary,
      overallScore: internal.overallScore,
      dimensions: internal.dimensions,
      strengths: internal.strengths,
      gaps: internal.gaps,
      transferableAdvantages: internal.transferableAdvantages,
      interviewAngles: internal.interviewAngles
    };
  }

  const fallback = buildRecruiterBriefFromInternalFromRequirements(requirements, internal, evidence);
  const verdict = normalizeVerdict(input && "overallMatch" in input ? input.overallMatch?.verdict : undefined, fallback.overallMatch.verdict);
  const label = verdictToLabel(verdict);

  return {
    mode: "recruiter_brief",
    overallMatch: {
      verdict,
      label
    },
    whereIMatch: verdict === "probably_not_your_person" ? undefined : normalizeMatchBullets((input as RecruiterBriefInput)?.whereIMatch, fallback.whereIMatch),
    gapsToNote: verdict === "probably_not_your_person" ? undefined : normalizeGapBullets((input as RecruiterBriefInput)?.gapsToNote, fallback.gapsToNote),
    whereIDontFit: verdict === "probably_not_your_person" ? normalizeGapBullets((input as RecruiterBriefInput)?.whereIDontFit, fallback.whereIDontFit) : undefined,
    whatDoesTransfer: verdict === "probably_not_your_person" ? normalizeTransferBullets((input as RecruiterBriefInput)?.whatDoesTransfer, fallback.whatDoesTransfer) : undefined,
    recommendation: sanitizeRecommendation((input as RecruiterBriefInput)?.recommendation, fallback.recommendation)
  };
}

function buildRecruiterBriefFromInternal(roleText: string, internal: InternalFitEvaluation, evidence: EvidenceChunk[]): RecruiterBriefPresentation {
  return buildRecruiterBriefFromInternalFromRequirements(extractRoleRequirements(roleText), internal, evidence);
}

function buildRecruiterBriefFromInternalFromRequirements(
  requirements: ExtractedRequirement[],
  internal: InternalFitEvaluation,
  evidence: EvidenceChunk[]
): RecruiterBriefPresentation {
  const matchedRequirements = buildRequirementEvidencePairs(requirements, evidence);
  const verdict = deriveVerdict(internal);

  if (verdict === "probably_not_your_person") {
    return {
      mode: "recruiter_brief",
      overallMatch: {
        verdict,
        label: verdictToLabel(verdict)
      },
      whereIDontFit: [
        {
          requirement: matchedRequirements[0]?.requirement ?? "Role-specific requirement fit",
          gap: "The available evidence does not currently prove the level of direct experience this role appears to require."
        },
        {
          requirement: matchedRequirements[1]?.requirement ?? "Scope of leadership",
          gap: "The current corpus does not clearly support the exact scale or specialization implied by the role."
        }
      ],
      whatDoesTransfer: [
        {
          skillOrExperience: "Product strategy and execution under ambiguity",
          relevance: "This experience still transfers to adjacent product, platform, and transformation roles."
        },
        {
          skillOrExperience: "Cross-functional leadership",
          relevance: "The evidence supports strong collaboration, decision framing, and delivery alignment across teams."
        }
      ],
      recommendation:
        "You likely need someone with more direct evidence against the missing requirements above. I would still be interested in the conversation, but based on the available evidence I do not think I am the clearest fit for this role."
    };
  }

  return {
    mode: "recruiter_brief",
    overallMatch: {
      verdict,
      label: verdictToLabel(verdict)
    },
    whereIMatch: matchedRequirements.slice(0, 5).map((item) => ({
      requirement: item.requirement,
      support: item.support
    })),
    gapsToNote:
      verdict === "probably_a_good_fit"
        ? [
            {
              requirement: "Most role-specific context requirement",
              gap: "Confirm the most specialized domain or operating-context expectation in interview."
            }
          ]
        : undefined,
    recommendation:
      verdict === "strong_fit_lets_talk"
        ? "I would fit this role well, and this looks like a conversation worth having. The combination of product ownership, cross-functional execution, and documented delivery outcomes makes the fit strong."
        : "I would likely fit this role well, with the interview best used to validate the most role-specific context or scope expectations. The core product, execution, and leadership evidence is already credible."
  };
}

function buildRequirementEvidencePairs(requirements: ExtractedRequirement[], evidence: EvidenceChunk[]): MatchBullet[] {
  const selectedRequirements =
    requirements.length > 0 ? requirements.slice(0, 5) : [{ requirement: "Core product ownership", priority: "important" as const }];
  const usedEvidenceIds = new Set<string>();

  return selectedRequirements.map((item) => {
    const bestEvidence = selectBestEvidenceForRequirement(item.requirement, evidence, usedEvidenceIds);
    if (bestEvidence) {
      usedEvidenceIds.add(bestEvidence.id);
    }

    return {
      requirement: shortenRequirement(item.requirement),
      support: summarizeSupportEvidence(bestEvidence) ?? "My prior work includes directly relevant product and delivery experience for this requirement."
    };
  });
}

function rankEvidenceForSupport(evidence: EvidenceChunk[]): EvidenceChunk[] {
  return [...evidence].sort((left, right) => evidencePreferenceScore(right) - evidencePreferenceScore(left));
}

function evidencePreferenceScore(item: EvidenceChunk): number {
  const section = item.section.toLowerCase();
  if (section.startsWith("achievement")) {
    return 5;
  }
  if (section.startsWith("outcome")) {
    return 4;
  }
  if (section.startsWith("action")) {
    return 3;
  }
  if (section === "summary") {
    return 2;
  }
  if (section === "situation" || section === "problem") {
    return 0;
  }
  return 1;
}

function summarizeSupportEvidence(item: EvidenceChunk | undefined): string | undefined {
  if (!item) {
    return undefined;
  }

  const text = item.text.trim().replace(/\s+/g, " ");
  const company = item.title.includes(" at ") ? item.title.split(" at ").at(-1) : item.title;
  const normalized = lowerCaseFirstAlpha(text);

  if (/^(led|built|defined|delivered|owned|ran|performed|managed|created|launched|introduced|contributed|coordinated|redesigned|implemented|developed|supported)/i.test(text)) {
    return `At ${company}, I ${normalized}`;
  }

  return `At ${company}, I worked on ${normalized}`;
}

function isLikelyRequirementSegment(segment: string): boolean {
  const normalized = segment.toLowerCase();

  if (segment.length > 320) {
    return false;
  }
  if (isLikelyLocationSegment(segment)) {
    return false;
  }
  if (/(equal opportunity|accommodation|benefits|privacy|cookies|sign in|apply now|job alert|share this job|page source|javascript|greenhouse|greenhouse\.io)/i.test(normalized)) {
    return false;
  }
  if (isLikelyTitleSegment(segment)) {
    return false;
  }
  if (!/(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|analy|align|work cross-functionally|vision|strategy|road-?map|requirements|mission|goal|bring|technical|familiarity|preferred)/i.test(normalized)) {
    return false;
  }

  return true;
}

function isLikelyLocationSegment(segment: string): boolean {
  const normalized = segment.toLowerCase().trim();
  const tokens = normalized.split(/[\s,;:/()-]+/).filter(Boolean);

  if (tokens.length === 0) {
    return false;
  }

  const locationTerms = new Set([
    "remote",
    "hybrid",
    "onsite",
    "on-site",
    "full",
    "time",
    "part",
    "contract",
    "united",
    "states",
    "state",
    "country",
    "city",
    "area",
    "region"
  ]);

  const likelyLocationWords = tokens.filter((token) => locationTerms.has(token) || /^[A-Z]{2}$/.test(token.toUpperCase()));
  const hasFewActionWords = !/(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|analy|align|strategy|road-?map|requirements|mission|goal|bring|technical)/i.test(segment);

  return hasFewActionWords && (likelyLocationWords.length >= 1 || /,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,/.test(segment) || /;\s*[A-Z][a-z]+/.test(segment));
}

function isLikelyTitleSegment(segment: string): boolean {
  const normalized = segment.trim();
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0 || words.length > 8) {
    return false;
  }

  const hasActionWord = /(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|analy|align|strategy|road-?map|requirements|mission|goal|bring|technical|responsible)/i.test(normalized);
  if (hasActionWord) {
    return false;
  }

  const titleWords = /(manager|director|lead|planner|engineer|product|program|principal|senior|staff|head|owner|specialist|architect|analyst)/i;
  const titleWordCount = words.reduce((sum, word) => sum + (titleWords.test(word) ? 1 : 0), 0);

  return titleWordCount >= Math.max(1, Math.floor(words.length / 2));
}

function dedupeRequirements(segments: string[]): string[] {
  const seen = new Set<string>();
  return segments.filter((segment) => {
    const key = segment.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function selectBestEvidenceForRequirement(
  requirement: string,
  evidence: EvidenceChunk[],
  usedEvidenceIds: Set<string>
): EvidenceChunk | undefined {
  const keywords = extractRequirementKeywords(requirement);

  const candidates = [...evidence].sort((left, right) => {
    const leftScore = requirementEvidenceScore(requirement, keywords, left, usedEvidenceIds.has(left.id));
    const rightScore = requirementEvidenceScore(requirement, keywords, right, usedEvidenceIds.has(right.id));
    return rightScore - leftScore;
  });

  return candidates[0];
}

function extractRequirementKeywords(requirement: string): string[] {
  const stopwords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "will", "have", "has", "your", "their", "across",
    "into", "through", "about", "role", "team", "teams", "product", "products", "manager", "senior"
  ]);

  return requirement
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !stopwords.has(token));
}

function requirementEvidenceScore(
  requirement: string,
  keywords: string[],
  item: EvidenceChunk,
  alreadyUsed: boolean
): number {
  const haystack = `${item.title} ${item.section} ${item.text} ${item.tags.join(" ")}`.toLowerCase();
  const keywordHits = keywords.reduce((sum, keyword) => sum + (haystack.includes(keyword) ? 1 : 0), 0);
  const directPhraseBonus = haystack.includes(requirement.toLowerCase()) ? 4 : 0;
  const reusePenalty = alreadyUsed ? 1 : 0;

  return evidencePreferenceScore(item) * 10 + keywordHits * 3 + directPhraseBonus - reusePenalty;
}

function shortenRequirement(requirement: string): string {
  return requirement.replace(/^(must have|required|preferred|ability to|experience with|experience in)\s+/i, "").trim();
}

function lowerCaseFirstAlpha(text: string): string {
  return text.replace(/[A-Z]/, (match) => match.toLowerCase());
}

function deriveVerdict(internal: InternalFitEvaluation): FitVerdict {
  const coreMatchScore = internal.dimensions.find((item) => item.name === "core_match")?.score ?? 0;

  if (internal.overallScore >= 8 && coreMatchScore >= 4) {
    return "strong_fit_lets_talk";
  }
  if (internal.overallScore >= 5) {
    return "probably_a_good_fit";
  }
  return "probably_not_your_person";
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
  return requirements.map((item, index) => `${index + 1}. [${item.priority}] ${item.requirement}`).join("\n");
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

function normalizeMatchBullets(values: MatchBullet[] | undefined, fallback: MatchBullet[] | undefined): MatchBullet[] | undefined {
  const normalized = (values ?? []).filter((item) => item.requirement?.trim() && item.support?.trim()).slice(0, 4);
  const fallbackNormalized = (fallback ?? []).slice(0, 4);
  return normalized.length > 0 ? normalized : fallbackNormalized.length > 0 ? fallbackNormalized : undefined;
}

function normalizeGapBullets(values: GapBullet[] | undefined, fallback: GapBullet[] | undefined): GapBullet[] | undefined {
  const normalized = (values ?? []).filter((item) => item.requirement?.trim() && item.gap?.trim()).slice(0, 4);
  const fallbackNormalized = (fallback ?? []).slice(0, 4);
  return normalized.length > 0 ? normalized : fallbackNormalized.length > 0 ? fallbackNormalized : undefined;
}

function normalizeTransferBullets(values: TransferBullet[] | undefined, fallback: TransferBullet[] | undefined): TransferBullet[] | undefined {
  const normalized = (values ?? [])
    .filter((item) => item.skillOrExperience?.trim() && item.relevance?.trim())
    .slice(0, 4);
  const fallbackNormalized = (fallback ?? []).slice(0, 4);
  return normalized.length > 0 ? normalized : fallbackNormalized.length > 0 ? fallbackNormalized : undefined;
}

function sanitizeRecommendation(value: string | undefined, fallback: string): string {
  const normalized = sanitizeText(value, fallback)
    .split(/(?<=[.!?])\s+/)
    .slice(0, 4)
    .join(" ")
    .trim();

  return normalized || fallback;
}

function normalizeStringList(values: string[] | undefined, fallback: string[]): string[] {
  const normalized = (values ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 4);
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeConfidence(value: string | undefined, fallback: FitAnalysisResult["confidence"]): FitAnalysisResult["confidence"] {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function normalizeVerdict(value: string | undefined, fallback: FitVerdict): FitVerdict {
  return value === "strong_fit_lets_talk" || value === "probably_a_good_fit" || value === "probably_not_your_person"
    ? value
    : fallback;
}

function verdictToLabel(verdict: FitVerdict): RecruiterBriefPresentation["overallMatch"]["label"] {
  switch (verdict) {
    case "strong_fit_lets_talk":
      return "Strong Fit - Let's talk";
    case "probably_a_good_fit":
      return "Probably a Good Fit";
    case "probably_not_your_person":
      return "Honest Assessment - Probably Not Your Person";
  }
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
