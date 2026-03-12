import type {
  ExtractedRoleRequirement,
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

type StageVersions = {
  requirementExtraction: string;
  retrieval: string;
  generation: string;
};

type RequirementEvidencePair = MatchBullet & {
  score: number;
  evidenceId?: string;
  direct: boolean;
};

type RoleFamily = "product_management" | "adjacent_product" | "non_product";

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
    "Reject clearly non-product roles even if some tools or domain terms overlap with Dmitry's background.",
    "Do not penalize the role for not mentioning AI or Dmitry's preferred domains unless those are explicit job requirements.",
    "Penalize unsupported must-have requirements and clear scope mismatches.",
    "Do not treat repeated evidence as separate proof points; repeated bullets should reference the earlier point instead of restating the same evidence.",
    "Do not treat older pre-LLM AI/ML or chatbot work as direct proof of modern LLM orchestration, RAG, evals, or agent workflows.",
    "Technology matches must respect context: integration or product-adjacent exposure is not the same as hands-on engineering ownership unless the evidence proves that depth.",
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

export function buildFitAnalysisUserPrompt(
  roleText: string,
  requirements: ExtractedRoleRequirement[],
  evidence: EvidenceChunk[],
  presentationMode: FitPresentationMode
): string {

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
    "- If the role is clearly outside product management, it should be treated as a bad fit even when some skills overlap.",
    "- Context readiness should be secondary unless domain or technical context is explicitly required.",
    "- A role that does not mention AI should not be treated as lower fit for that reason alone.",
    "- Lower the score only for unsupported must-haves, real scope mismatches, or clearly missing required context.",
    "- If the same evidence supports multiple bullets, show the first bullet normally and use 'Same as above.' or 'See previous point.' for later bullets.",
    "- Do not count pre-2023 AI/ML or chatbot work as direct evidence for modern LLM orchestration, RAG, evals, or agent workflows.",
    "- When a requirement names a technology, distinguish product-adjacent exposure from hands-on engineering implementation.",
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
    "For Honest Assessment - Probably Not Your Person, whereIDontFit must contain at least 3 bullets and at most 5.",
    "Extract up to 5 main job requirements, functions, or expectations that are a proven fit when the verdict is positive.",
    "For whereIMatch bullets, use the matched requirement as the title and the supporting evidence as the text.",
    "Supporting evidence should be a concise example of matching prior experience, outcome, result, or accomplishment, not a raw situation setup.",
    "For whereIDontFit bullets, explain the specific difference in experience or the missing qualification directly, such as missing mobile-development depth, required certification, clearance, or hands-on implementation context.",
    "For whereIDontFit bullets, if two points rely on the same explanation, show the first explanation fully and use 'Same as above.' or 'See previous point.' for the later bullet.",
    "For whereIDontFit bullets, keep each explanation tied to the specific requirement text. Do not attach certification or clearance gaps to unrelated technology requirements.",
    "For whereIDontFit bullets, if no specific mismatch can be supported, fall back to a generic statement that the current resume corpus does not show direct evidence for that requirement.",
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
  requirements: ExtractedRoleRequirement[],
  evidence: EvidenceChunk[],
  inputKind: "text" | "url" | "file",
  presentationMode: FitPresentationMode
): FitAnalysisResult {
  const internal = buildFallbackInternalFit(requirements, evidence);
  return assembleFitAnalysisResult({
    input: {
      internal,
      presentation: presentationMode === "recruiter_brief" ? buildRecruiterBriefFromInternal(requirements, internal, evidence) : undefined,
      confidence: evidence.length >= 4 ? "high" : evidence.length >= 2 ? "medium" : "low"
    },
    requirements,
    evidence,
    inputKind,
    presentationMode,
    evaluatorVersion: "v5-fallback-fit-analysis",
    stageVersions: {
      requirementExtraction: "v1-heuristic-fallback",
      retrieval: "v1-semantic-or-deterministic",
      generation: "v2-fallback-brief"
    }
  });
}

function buildFallbackInternalFit(requirements: ExtractedRoleRequirement[], evidence: EvidenceChunk[]): InternalFitEvaluation {
  const roleFamily = classifyRoleFamily(requirements);
  const matches = buildRequirementEvidencePairs(requirements, evidence);
  const strongMatchCount = matches.filter((item) => item.score >= 15).length;
  const weakMatchCount = matches.filter((item) => item.score < 12).length;
  const mustHaveWeakCount = requirements
    .slice(0, 5)
    .filter((item, index) => item.priority === "must_have" && (matches[index]?.score ?? 0) < 18)
    .length;
  const leadershipScopeMismatch = hasLeadershipScopeMismatch(requirements, evidence);
  const evidenceStrength = Math.min(2, evidence.length);
  const overallScore = Math.min(
    9,
    Math.max(
      1,
      5 + strongMatchCount + evidenceStrength - weakMatchCount - (mustHaveWeakCount * 2) - (leadershipScopeMismatch ? 3 : 0) - (roleFamily === "non_product" ? 4 : 0)
    )
  );

  return {
    overallSummary:
      "The evidence indicates strong qualification for this role's core product, execution, and cross-functional demands. The main interview focus should be validating the most role-specific context requirements.",
    overallScore,
    dimensions: [
      {
        name: "core_match",
        score: clampInteger(2 + strongMatchCount - mustHaveWeakCount - (roleFamily === "non_product" ? 2 : 0), 1, 5, 3),
        rationale: "The retrieved evidence supports the central product, strategy, and ownership responsibilities implied by the role.",
        evidence: evidence.slice(0, 3).map((item) => item.title)
      },
      {
        name: "execution_scope",
        score: clampInteger(2 + evidenceStrength + Math.min(1, strongMatchCount) - (roleFamily === "non_product" ? 1 : 0), 1, 5, 3),
        rationale: "The corpus shows repeated evidence of turning ambiguity into shipped outcomes, measurable impact, and structured delivery across multiple contexts.",
        evidence: evidence.slice(0, 3).map((item) => item.title)
      },
      {
        name: "leadership_collaboration",
        score: clampInteger(2 + Math.min(2, strongMatchCount) - (leadershipScopeMismatch ? 2 : 0), 1, 5, 3),
        rationale: "The evidence supports cross-functional leadership, stakeholder framing, and decision-making across complex initiatives.",
        evidence: evidence.slice(0, 2).map((item) => item.title)
      },
      {
        name: "context_readiness",
        score: clampInteger(4 - mustHaveWeakCount - (roleFamily === "non_product" ? 1 : 0), 1, 5, 3),
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
  requirements,
  evidence,
  inputKind,
  presentationMode,
  evaluatorVersion,
  stageVersions
}: {
  input: FitAnalysisResponseInput | null | undefined;
  requirements: ExtractedRoleRequirement[];
  evidence: EvidenceChunk[];
  inputKind: "text" | "url" | "file";
  presentationMode: FitPresentationMode;
  evaluatorVersion: string;
  stageVersions?: StageVersions;
}): FitAnalysisResult {
  const citations = buildCitations(evidence);
  const internalInput = input?.internal ?? pickInternalInput(input);
  const internal = normalizeInternalFitEvaluation(internalInput, evidence);
  const presentation = normalizePresentation(
    input?.presentation,
    internal,
    requirements,
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
      presentationMode,
      stageVersions
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

export function extractRoleRequirementsHeuristically(roleText: string): ExtractedRoleRequirement[] {
  const segments = roleText
    .split(/\n+|[•\-]\s+|\d+\.\s+/)
    .map((item) => item.trim())
    .map(sanitizeRequirementSegment)
    .filter((item) => item.length >= 20)
    .filter(isLikelyRequirementSegment);

  const prioritized = prioritizeRequirements(
    dedupeRequirements(segments).map((segment) => ({
      text: segment,
      category: inferRequirementCategory(segment),
      priority: inferRequirementPriority(segment)
    }))
  ).slice(0, 8);

  if (prioritized.length > 0) {
      return prioritized;
  }

  return [
    {
      text: sanitizeRequirementSegment(roleText.slice(0, 180)),
      category: "requirement" as const,
      priority: "important" as const
    }
  ].filter((item) => item.text.length > 0);
}

export function extractRoleRequirements(roleText: string): ExtractedRoleRequirement[] {
  return extractRoleRequirementsHeuristically(roleText);
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
  requirements: ExtractedRoleRequirement[],
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
    whereIDontFit: verdict === "probably_not_your_person"
      ? normalizeNoFitBullets((input as RecruiterBriefInput)?.whereIDontFit, fallback.whereIDontFit, requirements)
      : undefined,
    whatDoesTransfer: verdict === "probably_not_your_person" ? normalizeTransferBullets((input as RecruiterBriefInput)?.whatDoesTransfer, fallback.whatDoesTransfer) : undefined,
    recommendation: sanitizeRecommendation((input as RecruiterBriefInput)?.recommendation, fallback.recommendation)
  };
}

function buildRecruiterBriefFromInternal(
  requirements: ExtractedRoleRequirement[],
  internal: InternalFitEvaluation,
  evidence: EvidenceChunk[]
): RecruiterBriefPresentation {
  return buildRecruiterBriefFromInternalFromRequirements(requirements, internal, evidence);
}

function buildRecruiterBriefFromInternalFromRequirements(
  requirements: ExtractedRoleRequirement[],
  internal: InternalFitEvaluation,
  evidence: EvidenceChunk[]
): RecruiterBriefPresentation {
  const matchedRequirements = buildRequirementEvidencePairs(requirements, evidence);
  const verdict = deriveVerdict(internal);
  const roleFamily = classifyRoleFamily(requirements);
  const gapCandidates = buildGapCandidates(requirements, matchedRequirements);
  const noFitBullets = buildNoFitBullets(requirements, matchedRequirements, evidence, roleFamily);
  const transferCandidates = buildTransferBulletsFromEvidence(evidence);

  if (verdict === "probably_not_your_person" || roleFamily === "non_product") {
    return {
      mode: "recruiter_brief",
      overallMatch: {
        verdict: "probably_not_your_person",
        label: verdictToLabel("probably_not_your_person")
      },
      whereIDontFit: noFitBullets,
      whatDoesTransfer: transferCandidates.slice(0, 3),
      recommendation: buildNoFitRecommendation(noFitBullets)
    };
  }

  return {
    mode: "recruiter_brief",
    overallMatch: {
      verdict,
      label: verdictToLabel(verdict)
    },
    whereIMatch: groupMatchBullets(matchedRequirements.slice(0, 5)),
    gapsToNote: verdict === "probably_a_good_fit" ? gapCandidates.slice(0, 2) : undefined,
    recommendation:
      verdict === "strong_fit_lets_talk"
        ? "I would fit this role well, and this looks like a conversation worth having. The combination of product ownership, cross-functional execution, and documented delivery outcomes makes the fit strong."
        : "I would likely fit this role well, with the interview best used to validate the most role-specific context or scope expectations. The core product, execution, and leadership evidence is already credible."
  };
}

function buildRequirementEvidencePairs(requirements: ExtractedRoleRequirement[], evidence: EvidenceChunk[]): RequirementEvidencePair[] {
  const selectedRequirements =
    requirements.length > 0
      ? prioritizeRequirements(requirements).slice(0, 12)
      : [{ text: "Core product ownership", category: "requirement" as const, priority: "important" as const }];
  const candidates: RequirementEvidencePair[] = [];

  for (const item of selectedRequirements) {
    const bestEvidence = selectBestEvidenceForRequirement(item.text, evidence, new Set<string>());

    const support = summarizeSupportEvidence(bestEvidence?.chunk, item.text, evidence);
    const score =
      (bestEvidence?.score ?? 0) +
      Math.round(requirementPriorityScore(item) / 10) +
      seniorSignalBonus(item.text, bestEvidence?.chunk);
    if (!support || (!bestEvidence && !isGenericProductRequirement(item.text)) || score < minimumEvidenceScore(item.text)) {
      continue;
    }

    candidates.push({
      requirement: shortenRequirement(item.text),
      support,
      score,
      evidenceId: bestEvidence?.chunk.id,
      direct: score >= 12
    });
  }

  const sorted = [...candidates].sort((left, right) => right.score - left.score);
  const selected: RequirementEvidencePair[] = [];
  const seenEvidence = new Set<string>();

  for (const candidate of sorted) {
    const duplicateEvidencePenalty = candidate.evidenceId && seenEvidence.has(candidate.evidenceId) ? 6 : 0;
    const adjustedScore = candidate.score - duplicateEvidencePenalty;
    if (selected.length >= 5) {
      break;
    }
    if (adjustedScore < minimumEvidenceScore(candidate.requirement)) {
      continue;
    }
    selected.push({
      ...candidate,
      score: adjustedScore
    });
    if (candidate.evidenceId) {
      seenEvidence.add(candidate.evidenceId);
    }
  }

  return selected.length >= 3 ? selected : sorted.slice(0, Math.min(5, sorted.length));
}

function buildGapCandidates(
  requirements: ExtractedRoleRequirement[],
  matches: RequirementEvidencePair[]
): GapBullet[] {
  const explicitGaps = requirements
    .slice(0, 5)
    .map((requirement, index) => ({ requirement, match: matches[index] }))
    .filter(({ match }) => !match || !match.direct)
    .map(({ requirement }) => ({
      requirement: shortenRequirement(requirement.text),
      gap: requirement.priority === "must_have"
        ? "The current evidence set does not yet prove direct experience at the level this requirement appears to demand."
        : "This looks like a useful interview validation point rather than a proven strength in the current corpus."
    }));

  if (explicitGaps.length > 0) {
    return explicitGaps;
  }

  const nextRequirement = requirements.at(Math.min(matches.length, requirements.length - 1));
  return nextRequirement
    ? [{
        requirement: shortenRequirement(nextRequirement.text),
        gap: "This is the main role-specific point I would validate directly in interview."
      }]
    : [];
}

function groupMatchBullets(matches: RequirementEvidencePair[]): MatchBullet[] {
  const grouped = new Map<string, MatchBullet>();

  for (const item of matches) {
    const key = item.support.trim().toLowerCase();
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        requirement: item.requirement,
        support: item.support,
        relatedRequirements: [item.requirement]
      });
      continue;
    }

    existing.relatedRequirements = [
      ...(existing.relatedRequirements ?? [existing.requirement]),
      item.requirement
    ];
  }

  return Array.from(grouped.values()).map((item) => {
    const relatedRequirements = Array.from(new Set(item.relatedRequirements ?? [item.requirement]));
    return {
      requirement: relatedRequirements[0] ?? item.requirement,
      support: item.support,
      relatedRequirements
    };
  });
}

function buildNoFitBullets(
  requirements: ExtractedRoleRequirement[],
  matches: RequirementEvidencePair[],
  evidence: EvidenceChunk[],
  roleFamily: RoleFamily
): GapBullet[] {
  const bullets = requirements
    .slice(0, 5)
    .map((requirement, index) => ({
      requirement: shortenRequirement(requirement.text),
      gap: explainNoFitGap(requirement.text, matches[index], evidence, roleFamily)
    }))
    .filter((item) => item.requirement && item.gap);

  if (bullets.length >= 3) {
    return dedupeRepeatedGaps(bullets).slice(0, 5);
  }

  const padded = [...bullets];
  const genericFallbacks: GapBullet[] = [
    {
      requirement: "Role scope",
      gap: roleFamily === "non_product"
        ? "My background is product management rather than hands-on delivery in the primary function this role requires."
        : "The current corpus does not prove the scope this role appears to require."
    },
    {
      requirement: "Required implementation depth",
      gap: "I do not have enough direct hands-on implementation evidence for the depth this role asks for."
    },
    {
      requirement: "Specialized qualification",
      gap: "I do not currently have the exact specialized qualification or experience this role requires."
    }
  ];

  for (const fallback of genericFallbacks) {
    if (padded.length >= 3) {
      break;
    }
    padded.push(fallback);
  }

  return dedupeRepeatedGaps(padded).slice(0, 5);
}

function explainNoFitGap(
  requirement: string,
  match: RequirementEvidencePair | undefined,
  evidence: EvidenceChunk[],
  roleFamily: RoleFamily
): string {
  const normalizedRequirement = requirement.toLowerCase();
  const topEvidence = match?.evidenceId ? evidence.find((item) => item.id === match.evidenceId) : undefined;
  const evidenceText = `${topEvidence?.title ?? ""} ${topEvidence?.text ?? ""}`.toLowerCase();
  const specificTechnology = extractSpecificTechnology(requirement);
  const article = startsWithVowelSound(specificTechnology) ? "an" : "a";

  if (/(android|ios|mobile development|mobile application)/i.test(normalizedRequirement)) {
    return "Although my career has been mostly about enterprise software and SaaS, I do not have enough hands-on mobile development experience for this requirement.";
  }
  if (/salesforce/.test(normalizedRequirement) && /(extension|apex|developer|hands-on|implementation)/i.test(normalizedRequirement) && /salesforce/.test(evidenceText)) {
    return "My experience references Salesforce in an integration and workflow context, not building Salesforce extensions directly.";
  }
  if (/(aws|kubernetes|k8s|typescript|java|python|go|react)/i.test(normalizedRequirement) && /(developer|engineer|hands-on|implementation|coding|operate|cluster|infra)/i.test(normalizedRequirement)) {
    if (specificTechnology) {
      return `I do not have enough direct hands-on engineering experience with ${specificTechnology} in the context this role requires.`;
    }
    return "I do not have enough direct hands-on engineering experience with this technology in the context the role requires.";
  }
  if (/(certification|certified|clearance|secret|top secret|ts\/sci)/i.test(normalizedRequirement) && !specificTechnology) {
    return "I do not have the required certification or clearance.";
  }
  if (roleFamily === "non_product") {
    if (specificTechnology) {
      return `My background is in product management rather than hands-on implementation, and I do not have enough direct ${specificTechnology} delivery experience for this requirement.`;
    }
    return "My background is in product management rather than hands-on execution in this role family.";
  }
  if (match?.support) {
    return `My closest evidence is adjacent rather than direct here: ${stripLeadIn(match.support)}`;
  }

  if (/(certification|certified|clearance|secret|top secret|ts\/sci)/i.test(normalizedRequirement)) {
    return "I do not have the required certification or clearance.";
  }
  if (specificTechnology) {
    return `The current resume corpus does not show direct evidence that I have ${article} ${specificTechnology} background at the level this requirement appears to demand.`;
  }

  return "The current resume corpus does not show direct evidence for this requirement at the level the role appears to demand.";
}

function stripLeadIn(text: string): string {
  return text.replace(/^At [^,]+, I /, "").replace(/^I /, "");
}

function buildTransferBulletsFromEvidence(evidence: EvidenceChunk[]): TransferBullet[] {
  const seen = new Set<string>();

  return rankEvidenceForSupport(evidence)
    .map((item) => ({
      skillOrExperience: buildTransferTitle(item),
      relevance: summarizeSupportEvidence(item) ?? "My prior work includes directly relevant experience that would transfer to this role."
    }))
    .filter((item) => {
      const key = item.skillOrExperience.toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function buildTransferTitle(item: EvidenceChunk): string {
  const normalizedText = `${item.section} ${item.text}`.toLowerCase();

  if (/\b(workflow|process|operating model|delivery model|transformation|redesign)\b/.test(normalizedText)) {
    return "Workflow redesign and operating-model delivery";
  }
  if (/\b(vendor|stakeholder|cross-functional|alignment|coordination)\b/.test(normalizedText)) {
    return "Cross-functional and stakeholder coordination";
  }
  if (/\b(cloud|migration|aws|infrastructure|deployment)\b/.test(normalizedText)) {
    return "Cloud and platform transformation";
  }
  if (/\b(roadmap|prioritization|strategy|vision|discovery)\b/.test(normalizedText)) {
    return "Product strategy and prioritization";
  }
  if (/\b(ai|llm|evaluation|orchestration|retrieval|assistant)\b/.test(normalizedText)) {
    return "AI product strategy and evaluation";
  }
  if (/\b(healthcare|regulated|compliance|kyc|risk)\b/.test(normalizedText)) {
    return "Regulated product delivery";
  }
  if (/\b(customer|enterprise|saas|platform)\b/.test(normalizedText)) {
    return "Enterprise product delivery";
  }

  const tagTitle = buildTransferTitleFromTags(item.tags);
  if (tagTitle) {
    return tagTitle;
  }

  return "Transferable product and delivery experience";
}

function buildNoFitRecommendation(gaps: GapBullet[]): string {
  const leadGap = gaps[0]?.requirement?.toLowerCase();
  if (leadGap) {
    return `You likely need someone with clearer direct evidence against ${leadGap}. I would still be interested in the conversation, but based on the current corpus I do not think I am the clearest fit for this role.`;
  }

  return "You likely need someone with more direct evidence against the missing requirements above. I would still be interested in the conversation, but based on the current corpus I do not think I am the clearest fit for this role.";
}

function dedupeRepeatedGaps(gaps: GapBullet[]): GapBullet[] {
  const seen = new Set<string>();

  return gaps.map((item) => {
    const key = item.gap.trim().toLowerCase();
    if (!key) {
      return item;
    }
    if (seen.has(key)) {
      return {
        ...item,
        gap: "Same as above."
      };
    }
    seen.add(key);
    return item;
  });
}

function classifyRoleFamily(requirements: ExtractedRoleRequirement[]): RoleFamily {
  const text = requirements.map((item) => item.text).join(" ").toLowerCase();

  const nonProductSignals = /(software engineer|engineering manager|devops|sre|site reliability|sales engineer|account executive|support engineer|tech support|customer support|developer advocate|solutions architect|security engineer|data engineer|ml engineer|backend engineer|frontend engineer|full stack|android application development|android engineer|ios development|kotlin application architecture|mobile development)/;
  const productSignals = /(product manager|product management|roadmap|product requirements|customer discovery|stakeholder alignment|go-to-market|product strategy|prioritization|user research|product vision|cross-functional)/;
  const adjacentSignals = /(platform strategy|business analysis|program management|project management|product operations|product marketing)/;

  if (productSignals.test(text)) {
    return "product_management";
  }
  if (nonProductSignals.test(text) && !productSignals.test(text)) {
    return "non_product";
  }
  if (adjacentSignals.test(text)) {
    return "adjacent_product";
  }
  return "product_management";
}

function hasLeadershipScopeMismatch(requirements: ExtractedRoleRequirement[], evidence: EvidenceChunk[]): boolean {
  const requiresExecutiveScope = requirements.some((item) =>
    /\b(vp|vice president|p&l|general manager|manage directors|multi-layer|org leadership|enterprise scale|large consumer marketplace)\b/i.test(item.text)
  );

  if (!requiresExecutiveScope) {
    return false;
  }

  return !evidence.some((item) =>
    /\b(vp|vice president|director|portfolio|gm|general manager|p&l|org leadership|enterprise scale)\b/i.test(`${item.title} ${item.text}`)
  );
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
  if (section === "project-work") {
    return 4;
  }
  if (section === "project-approach") {
    return 2;
  }
  if (section === "summary") {
    return 1;
  }
  if (section === "situation" || section === "problem") {
    return 0;
  }
  return 1;
}

function summarizeSupportEvidence(
  item: EvidenceChunk | undefined,
  requirement?: string,
  evidencePool: EvidenceChunk[] = []
): string | undefined {
  if (!item) {
    if (requirement && isGenericProductRequirement(requirement)) {
      return buildGenericProductEvidenceSentence(evidencePool);
    }
    return undefined;
  }

  if (requirement && isGenericProductRequirement(requirement)) {
    return buildGenericProductEvidenceSentence(evidencePool);
  }

  const text = item.text.trim().replace(/\s+/g, " ");
  const company = item.metadata?.company ?? inferCompanyFromTitle(item);
  const portfolioSummary = summarizePortfolioEvidence(item, evidencePool);
  if (portfolioSummary) {
    return portfolioSummary;
  }
  const normalized = lowerCaseFirstAlpha(text);

  if (/^(led|built|defined|delivered|owned|ran|performed|managed|created|launched|introduced|contributed|coordinated|redesigned|implemented|developed|supported)/i.test(text)) {
    return company ? `At ${company}, I ${normalized}` : `In a prior role, I ${normalized}`;
  }

  return company ? `At ${company}, I worked on ${normalized}` : `In a prior role, I worked on ${normalized}`;
}

function isGenericProductRequirement(requirement: string): boolean {
  const normalized = requirement.toLowerCase();
  return (
    /(product manager|product owner|saas business|discovery|requirements|grooming backlogs|backlog|delivery with engineering|partner with engineering|roadmap|prioritization)/.test(normalized) &&
    !/(aws|kubernetes|salesforce|typescript|python|java|go|react|android|ios|llm|rag|retrieval|evaluation|buy vs\.? build|travel technology|autonomous|healthcare|compliance|clearance|certification)/.test(normalized)
  );
}

function buildTransferTitleFromTags(tags: string[]): string | undefined {
  const normalized = tags.map((tag) => tag.toLowerCase());

  if (normalized.includes("strategy") || normalized.includes("roadmap")) {
    return "Product strategy and roadmap ownership";
  }
  if (normalized.includes("leadership") || normalized.includes("stakeholders")) {
    return "Cross-functional leadership";
  }
  if (normalized.includes("ai")) {
    return "AI product strategy and delivery";
  }
  if (normalized.includes("execution")) {
    return "Execution under ambiguity";
  }
  if (normalized.includes("compliance")) {
    return "Compliance-aware product delivery";
  }

  return undefined;
}

function inferCompanyFromTitle(item: EvidenceChunk): string | undefined {
  if (item.metadata?.company) {
    return item.metadata.company;
  }
  if (item.sourceType === "resume" && item.title.includes(" at ")) {
    return item.title.split(" at ").at(-1)?.trim() || undefined;
  }
  return undefined;
}

function isLikelyRequirementSegment(segment: string): boolean {
  const cleanedSegment = sanitizeRequirementSegment(segment);
  const normalized = cleanedSegment.toLowerCase();

  if (cleanedSegment.length > 320 || cleanedSegment.length < 20) {
    return false;
  }
  if (/[{}[\]]|themeoptions|customtheme|customfonts|vscdn|font-family|cdn/i.test(cleanedSegment)) {
    return false;
  }
  if (isLikelyLocationSegment(cleanedSegment)) {
    return false;
  }
  if (/(equal opportunity|accommodation|benefits|privacy|cookies|sign in|apply now|job alert|share this job|page source|javascript|greenhouse|greenhouse\.io)/i.test(normalized)) {
    return false;
  }
  if (isCultureEnvironmentSegment(cleanedSegment)) {
    return false;
  }
  if (isLikelyTitleSegment(cleanedSegment)) {
    return false;
  }
  if (!/(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|analy|align|work cross-functionally|vision|strategy|road-?map|requirements|mission|goal|bring|technical|familiarity|preferred|certification|certified|clearance)/i.test(normalized)) {
    return false;
  }

  return true;
}

function isCultureEnvironmentSegment(segment: string): boolean {
  const normalized = segment.toLowerCase().trim();

  if (
    /(positive and collaborative work environment|focus on innovation and sustainability|work environment|company culture|inclusive culture|values-driven culture|fast-paced startup environment)/.test(normalized)
  ) {
    return true;
  }

  return (
    /(environment|culture|values|sustainability|innovative|innovation)/.test(normalized) &&
    !/(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|align|road-?map|requirements|backlog|discovery|stakeholder|engineering|strategy|process|team|mentor|coach)/.test(normalized)
  );
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
    const key = sanitizeRequirementSegment(segment).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function prioritizeRequirements(requirements: ExtractedRoleRequirement[]): ExtractedRoleRequirement[] {
  return [...requirements]
    .filter((item) => !isCompanyMissionIntro(item.text))
    .sort((left, right) => requirementPriorityScore(right) - requirementPriorityScore(left));
}

function requirementPriorityScore(requirement: ExtractedRoleRequirement): number {
  const priorityScore =
    requirement.priority === "must_have" ? 30 : requirement.priority === "important" ? 20 : 10;
  const categoryScore =
    requirement.category === "requirement"
      ? 12
      : requirement.category === "function"
        ? 10
        : requirement.category === "expectation"
          ? 8
          : 2;
  const specificityScore = Math.min(8, extractRequirementKeywords(requirement.text).length);
  const missionPenalty = requirement.category === "mission" ? 8 : 0;

  return priorityScore + categoryScore + specificityScore - missionPenalty;
}

function isCompanyMissionIntro(segment: string): boolean {
  const normalized = segment.toLowerCase();
  return (
    /our mission is|together, we are writing|come be a part of what'?s next|we are a dream team|we'?re a fast-growing|we are transforming the \$?\d/i.test(normalized) &&
    !/(you will|responsibilities|requirements|qualifications|experience|ability|develop|drive|lead|build|deliver|define|own)/i.test(normalized)
  );
}

function selectBestEvidenceForRequirement(
  requirement: string,
  evidence: EvidenceChunk[],
  usedEvidenceIds: Set<string>
): { chunk: EvidenceChunk; score: number } | undefined {
  const keywords = extractRequirementKeywords(requirement);

  const candidates = [...evidence]
    .map((item) => ({
      chunk: item,
      score: requirementEvidenceScore(requirement, keywords, item, usedEvidenceIds.has(item.id))
    }))
    .sort((left, right) => right.score - left.score);

  const bestUnused = candidates.find((candidate) => !usedEvidenceIds.has(candidate.chunk.id));

  if (!bestUnused) {
    return undefined;
  }

  return bestUnused.score >= minimumEvidenceScore(requirement) ? bestUnused : undefined;
}

function extractRequirementKeywords(requirement: string): string[] {
  const stopwords = new Set([
    "the", "and", "for", "with", "from", "that", "this", "will", "have", "has", "your", "their", "across",
    "into", "through", "about", "role", "team", "teams", "product", "products", "manager", "senior",
    "years", "year", "experience", "proven", "track", "record", "business"
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
  const reusePenalty = alreadyUsed ? 25 : 0;
  const rolePenalty = roleFamilyPenalty(requirement, item);
  const recencyPenalty = technologyRecencyPenalty(requirement, item);
  const recencyBonus = generalRecencyBonus(item);
  const contextPenalty = technologyContextPenalty(requirement, item);
  const catchAllRolePenalty = roleSpecificityPenalty(item);
  const specificityPenalty = specificityCoveragePenalty(keywords, keywordHits);
  const domainBonus = domainSpecificEvidenceBonus(requirement, haystack);
  const leadershipBonus = leadershipProcessEvidenceBonus(requirement, haystack);
  const leadershipPenalty = leadershipMismatchPenalty(requirement, haystack);

  return evidencePreferenceScore(item) * 10 + keywordHits * 5 + directPhraseBonus + recencyBonus + domainBonus + leadershipBonus - reusePenalty - rolePenalty - recencyPenalty - contextPenalty - catchAllRolePenalty - specificityPenalty - leadershipPenalty;
}

function roleSpecificityPenalty(item: EvidenceChunk): number {
  if (item.metadata?.relatedRoleId === "vingis") {
    return 4;
  }

  return 0;
}

function specificityCoveragePenalty(keywords: string[], keywordHits: number): number {
  if (keywords.length >= 4 && keywordHits === 0) {
    return 16;
  }
  if (keywords.length >= 3 && keywordHits <= 1) {
    return 10;
  }
  return 0;
}

function domainSpecificEvidenceBonus(requirement: string, haystack: string): number {
  const req = requirement.toLowerCase();
  let bonus = 0;

  if (/\benterprise\b/.test(req) && /\benterprise\b/.test(haystack)) {
    bonus += 4;
  }
  if (/\bintegration\b/.test(req) && /\bintegration\b/.test(haystack)) {
    bonus += 5;
  }
  if (/\b(requirements|backlog|grooming|discovery)\b/.test(req) && /\b(requirements|backlog|discovery|prioritization)\b/.test(haystack)) {
    bonus += 3;
  }
  if (/\b(technical development|product testing|launch|training|rollout)\b/.test(req) && /\b(testing|launch|training|rollout|implementation|delivery)\b/.test(haystack)) {
    bonus += 4;
  }
  if (/\b(tradeoffs?|edge cases|implementation details|scalable solutions)\b/.test(req) && /\b(tradeoffs?|architecture|implementation|scalable|platform)\b/.test(haystack)) {
    bonus += 4;
  }

  return bonus;
}

function leadershipProcessEvidenceBonus(requirement: string, haystack: string): number {
  const req = requirement.toLowerCase();
  let bonus = 0;

  if (/\b(player.?coach|leadership|lead product team|mentor|develop a small product team|high-performing product function|product processes?|operating rhythms?)\b/.test(req)) {
    if (/\b(team building|team leadership|built local team|manager|product development manager|leadership|mentor|coordinated|governance|alignment|agile|process|operating|workshop|prioritization)\b/.test(haystack)) {
      bonus += 8;
    }
    if (/\b(discovery|requirements|roadmap|stakeholder|delivery)\b/.test(haystack)) {
      bonus += 3;
    }
  }

  if (/\b(strategy|strategic leadership|vision)\b/.test(req) && /\b(strategy|workshop|roadmap|kpi|alignment|prioritization)\b/.test(haystack)) {
    bonus += 4;
  }

  return bonus;
}

function leadershipMismatchPenalty(requirement: string, haystack: string): number {
  const req = requirement.toLowerCase();

  if (!/\b(player.?coach|leadership|lead product team|mentor|develop a small product team|high-performing product function|product processes?|operating rhythms?)\b/.test(req)) {
    return 0;
  }

  if (/\b(api|workflow|kyc|integration|provider|portal|assistant)\b/.test(haystack) && !/\b(team|manager|leadership|process|agile|workshop|governance|alignment|mentor|delivery)\b/.test(haystack)) {
    return 10;
  }

  if (!/\b(team|manager|leadership|process|agile|workshop|governance|alignment|mentor|delivery|prioritization)\b/.test(haystack)) {
    return 6;
  }

  return 0;
}

function roleFamilyPenalty(requirement: string, item: EvidenceChunk): number {
  if (!/product|roadmap|stakeholder|discovery|prioritization|vision/i.test(requirement)) {
    return 0;
  }

  const haystack = `${item.title} ${item.text}`.toLowerCase();
  if (/\bsoftware development roles\b|\bengineer\b|\bengineering\b/.test(haystack) && !/\bproduct\b/.test(haystack)) {
    return 8;
  }
  return 0;
}

function technologyRecencyPenalty(requirement: string, item: EvidenceChunk): number {
  if (!/\b(llm|large language model|rag|retrieval augmented|agent workflow|agentic|evals?|orchestration)\b/i.test(requirement)) {
    return 0;
  }

  const evidenceText = `${item.title} ${item.text} ${item.tags.join(" ")}`.toLowerCase();
  const endDate = item.metadata?.endDate ?? item.metadata?.startDate;
  const looksModern = /\b(llm|claude|gpt|anthropic|rag|retrieval augmented|agent workflow|orchestration|evaluation framework)\b/i.test(evidenceText);
  const isOlder = !!endDate && endDate < "2023-01";

  if (looksModern) {
    return 0;
  }
  if (isOlder && /\b(ai|ml|machine learning|chatbot|conversational assistant|predictive analytics)\b/i.test(evidenceText)) {
    return 12;
  }
  return 6;
}

function technologyContextPenalty(requirement: string, item: EvidenceChunk): number {
  const req = requirement.toLowerCase();
  const evidenceText = `${item.title} ${item.text} ${item.tags.join(" ")}`.toLowerCase();

  if (/salesforce/.test(req) && /(extension|apex|developer|hands-on|implementation)/.test(req) && /salesforce/.test(evidenceText) && /integration|distributed|across salesforce/.test(evidenceText)) {
    return 10;
  }
  if (/typescript/.test(req) && /(developer|engineer|hands-on|coding|implementation)/.test(req) && !/typescript|ts|implemented|built|developed/.test(evidenceText)) {
    return 8;
  }
  if (/(aws|kubernetes|k8s)/.test(req) && /(hands-on|operate|cluster|infra|infrastructure|engineering)/.test(req) && !/(hands-on|implemented|built|operated|cluster|infra|infrastructure|engineering)/.test(evidenceText)) {
    return 8;
  }

  return 0;
}

function generalRecencyBonus(item: EvidenceChunk): number {
  const referenceDate = item.metadata?.endDate ?? item.metadata?.startDate;
  if (!referenceDate) {
    return 0;
  }

  if (referenceDate >= "2024-01") {
    return 4;
  }
  if (referenceDate >= "2021-01") {
    return 3;
  }
  if (referenceDate >= "2018-01") {
    return 2;
  }
  if (referenceDate >= "2015-01") {
    return 1;
  }

  return 0;
}

function minimumEvidenceScore(requirement: string): number {
  return isGenericProductRequirement(requirement) ? 10 : 14;
}

function seniorSignalBonus(requirement: string, item: EvidenceChunk | undefined): number {
  if (!item) {
    return 0;
  }

  const req = requirement.toLowerCase();
  const roleTitle = item.metadata?.roleTitle?.toLowerCase() ?? "";
  const haystack = `${item.title} ${item.section} ${item.text} ${item.tags.join(" ")}`.toLowerCase();
  let bonus = 0;

  if (/\b(strategy|strategic|vision|roadmap|prioritization|stakeholder|cross-functional)\b/.test(req) && /\b(strategy|strategic|roadmap|kpi|stakeholder|cross-functional|alignment|workshop)\b/.test(haystack)) {
    bonus += 4;
  }

  if (/\b(lead|mentor|develop|player.?coach|team|operating rhythms?|processes?)\b/.test(req)) {
    if (/\b(manager|lead|head|director)\b/.test(roleTitle)) {
      bonus += 4;
    }
    if (/\b(team|leadership|agile|process|operating|governance|alignment|coordination|delivery)\b/.test(haystack)) {
      bonus += 4;
    }
  }

  if (/\b(own|ownership|end-to-end|product owner|product manager)\b/.test(req) && /\b(owned|led|delivery|launch|roadmap|requirements|discovery)\b/.test(haystack)) {
    bonus += 3;
  }

  return bonus;
}

function sanitizeRequirementSegment(segment: string): string {
  return segment
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/gi, "\"")
    .replace(/&#34;/gi, "\"")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function findMostRecentCompany(evidencePool: EvidenceChunk[]): string | undefined {
  return [...evidencePool]
    .filter((item) => item.metadata?.company)
    .sort((left, right) => (right.metadata?.endDate ?? right.metadata?.startDate ?? "").localeCompare(left.metadata?.endDate ?? left.metadata?.startDate ?? ""))
    .at(0)?.metadata?.company;
}

function buildGenericProductEvidenceSentence(evidencePool: EvidenceChunk[]): string {
  const examples = selectGenericProductRoleExamples(evidencePool);
  if (examples.length >= 2) {
    return `In my recent product roles, including ${examples[0]} and ${examples[1]}, I led discovery, defined requirements, prioritized work, and drove delivery with engineering teams.`;
  }
  if (examples.length === 1) {
    return `In my recent product roles, including ${examples[0]}, I led discovery, defined requirements, prioritized work, and drove delivery with engineering teams.`;
  }
  return "In my recent product roles, I led discovery, defined requirements, prioritized work, and drove delivery with engineering teams.";
}

function selectGenericProductRoleExamples(evidencePool: EvidenceChunk[]): string[] {
  const seen = new Set<string>();

  return [...evidencePool]
    .filter((item) => isNamedGenericProductRoleCandidate(item))
    .sort((left, right) => (right.metadata?.endDate ?? right.metadata?.startDate ?? "").localeCompare(left.metadata?.endDate ?? left.metadata?.startDate ?? ""))
    .map((item) => item.metadata?.company)
    .filter((company): company is string => !!company)
    .filter((company) => {
      const key = company.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, 2);
}

function isNamedGenericProductRoleCandidate(item: EvidenceChunk): boolean {
  const company = item.metadata?.company?.toLowerCase();
  const roleTitle = item.metadata?.roleTitle?.toLowerCase() ?? "";
  const text = `${item.title} ${item.text} ${item.tags.join(" ")}`.toLowerCase();

  if (!company || company === "vingis") {
    return false;
  }

  return (
    /\bproduct\b/.test(roleTitle) &&
    /\b(discovery|requirements|roadmap|prioritization|stakeholder|delivery|execution)\b/.test(text)
  );
}

function summarizePortfolioEvidence(item: EvidenceChunk, evidencePool: EvidenceChunk[]): string | undefined {
  const text = item.text.toLowerCase();
  const company = item.metadata?.company ?? inferCompanyFromTitle(item);
  if (!company || !/portfolio of anonymized .*engagements/.test(text)) {
    return undefined;
  }

  const examples = Array.from(new Set(
    evidencePool
      .filter((candidate) => candidate.metadata?.company === company && candidate.section === "project-work")
      .map(inferProjectEssence)
      .filter((value): value is string => !!value)
  )).slice(0, 3);

  if (examples.length === 0) {
    return `At ${company}, I worked across a portfolio of enterprise product engagements with measurable business outcomes in complex operating environments.`;
  }

  return `At ${company}, I worked across a portfolio of enterprise product engagements, including ${formatExampleList(examples)}.`;
}

function inferProjectEssence(item: EvidenceChunk): string | undefined {
  const text = `${item.title} ${item.text}`.toLowerCase();

  if (/conversational (product knowledge )?assistant|knowledge assistant/.test(text)) {
    return "a conversational AI assistant";
  }
  if (/fleet management portal/.test(text)) {
    return "a fleet management portal";
  }
  if (/\bkyc\b/.test(text)) {
    return "a KYC workflow";
  }
  if (/api docs portal|external api docs portal/.test(text)) {
    return "an API docs portal";
  }
  if (/regulated portfolio|service management compliance/.test(text)) {
    return "regulated service-management initiatives";
  }

  return undefined;
}

function formatExampleList(examples: string[]): string {
  if (examples.length === 1) {
    return examples[0] ?? "";
  }
  if (examples.length === 2) {
    return `${examples[0]} and ${examples[1]}`;
  }
  return `${examples.slice(0, -1).join(", ")}, and ${examples.at(-1)}`;
}

function extractSpecificTechnology(requirement: string): string | undefined {
  const technologies = [
    "asyncio",
    "pydantic",
    "rest api",
    "rest apis",
    "docker",
    "serverless containers",
    "aws",
    "ecs",
    "iam",
    "api gateway",
    "vpc",
    "secrets manager",
    "python",
    "kotlin",
    "android",
    "ios",
    "typescript",
    "salesforce",
    "kubernetes",
    "k8s",
    "react",
    "java",
    "go"
  ];

  const normalized = requirement.toLowerCase();
  const matched = technologies.filter((item) => normalized.includes(item));
  if (matched.length === 0) {
    return undefined;
  }

  const unique = Array.from(new Set(matched));
  return unique.slice(0, 3).join(", ");
}

function startsWithVowelSound(value: string | undefined): boolean {
  return !!value && /^[aeiou]/i.test(value);
}

function shortenRequirement(requirement: string): string {
  return requirement.replace(/^(must have|required|preferred|ability to|experience with|experience in)\s+/i, "").trim();
}

function lowerCaseFirstAlpha(text: string): string {
  return text.replace(/[A-Z]/, (match) => match.toLowerCase());
}

function deriveVerdict(internal: InternalFitEvaluation): FitVerdict {
  const coreMatchScore = internal.dimensions.find((item) => item.name === "core_match")?.score ?? 0;
  const contextReadinessScore = internal.dimensions.find((item) => item.name === "context_readiness")?.score ?? 0;
  const weakDimensionCount = internal.dimensions.filter((item) => item.score <= 2).length;

  if (internal.overallScore >= 8 && coreMatchScore >= 4) {
    return "strong_fit_lets_talk";
  }
  if (internal.overallScore <= 4 || (coreMatchScore <= 3 && contextReadinessScore <= 2) || weakDimensionCount >= 2) {
    return "probably_not_your_person";
  }
  if (internal.overallScore >= 5) {
    return "probably_a_good_fit";
  }
  return "probably_not_your_person";
}

function inferRequirementPriority(segment: string): ExtractedRoleRequirement["priority"] {
  const normalized = segment.toLowerCase();
  if (/(must|required|requirement|need to|needs to|minimum|proven|hands-on)/.test(normalized)) {
    return "must_have";
  }
  if (/(preferred|nice to have|bonus|plus|ideally)/.test(normalized)) {
    return "nice_to_have";
  }
  return "important";
}

function inferRequirementCategory(segment: string): ExtractedRoleRequirement["category"] {
  const normalized = segment.toLowerCase();
  if (/(mission|goal|bring .* to market|transform|advance|enable)/.test(normalized)) {
    return "mission";
  }
  if (/(develop|drive|lead|build|deliver|determine|define|gather|align|partner|work cross-functionally|own)/.test(normalized)) {
    return "function";
  }
  if (/(experience|ability|familiarity|preferred|hands-on|proven)/.test(normalized)) {
    return "requirement";
  }
  return "expectation";
}

function formatRequirements(requirements: ExtractedRoleRequirement[]): string {
  return requirements.map((item, index) => `${index + 1}. [${item.priority}/${item.category}] ${item.text}`).join("\n");
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
  const normalized = (values ?? [])
    .filter((item) => item.requirement?.trim() && item.support?.trim())
    .map((item) => ({
      ...item,
      relatedRequirements: normalizeRelatedRequirements(item.relatedRequirements, item.requirement)
    }))
    .slice(0, 4);
  const fallbackNormalized = (fallback ?? [])
    .map((item) => ({
      ...item,
      relatedRequirements: normalizeRelatedRequirements(item.relatedRequirements, item.requirement)
    }))
    .slice(0, 4);
  return normalized.length > 0 ? normalized : fallbackNormalized.length > 0 ? fallbackNormalized : undefined;
}

function normalizeRelatedRequirements(values: string[] | undefined, requirement: string): string[] | undefined {
  const normalized = Array.from(new Set((values ?? [requirement]).map((item) => item.trim()).filter(Boolean)));
  return normalized.length > 1 ? normalized : undefined;
}

function normalizeGapBullets(values: GapBullet[] | undefined, fallback: GapBullet[] | undefined): GapBullet[] | undefined {
  const normalized = (values ?? []).filter((item) => item.requirement?.trim() && item.gap?.trim()).slice(0, 4);
  const fallbackNormalized = (fallback ?? []).slice(0, 4);
  return normalized.length > 0 ? normalized : fallbackNormalized.length > 0 ? fallbackNormalized : undefined;
}

function normalizeNoFitBullets(
  values: GapBullet[] | undefined,
  fallback: GapBullet[] | undefined,
  requirements: ExtractedRoleRequirement[]
): GapBullet[] | undefined {
  const normalized = dedupeRepeatedGaps(
    (values ?? [])
      .filter((item) => item.requirement?.trim() && item.gap?.trim())
      .filter((item) => isConsistentNoFitBullet(item, requirements))
  ).slice(0, 5);

  if (normalized.length >= 3) {
    return normalized;
  }

  const fallbackNormalized = dedupeRepeatedGaps(
    (fallback ?? []).filter((item) => item.requirement?.trim() && item.gap?.trim())
  ).slice(0, 5);

  return fallbackNormalized.length > 0 ? fallbackNormalized : undefined;
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

function isConsistentNoFitBullet(item: GapBullet, requirements: ExtractedRoleRequirement[]): boolean {
  const requirement = item.requirement.toLowerCase();
  const gap = item.gap.toLowerCase();

  if (gap === "same as above." || gap === "see previous point.") {
    return true;
  }

  const knownRequirement = requirements.some((candidate) => shortenRequirement(candidate.text).toLowerCase() === requirement);
  if (!knownRequirement) {
    return false;
  }

  if (/(certification|certified|clearance|secret|top secret|ts\/sci)/.test(gap) && !/(certification|certified|clearance|secret|top secret|ts\/sci)/.test(requirement)) {
    return false;
  }
  if (/(android|ios|mobile development|mobile application)/.test(gap) && !/(android|ios|mobile development|mobile application)/.test(requirement)) {
    return false;
  }

  const requirementTechnology = extractSpecificTechnology(requirement);
  const leadTechnology = requirementTechnology?.split(",")[0]?.trim();
  if (
    leadTechnology &&
    /(asyncio|pydantic|rest api|docker|serverless containers|aws|ecs|iam|api gateway|vpc|secrets manager|python|kotlin|android|ios|typescript|salesforce|kubernetes|k8s|react|java|go)/.test(gap) &&
    !gap.includes(leadTechnology)
  ) {
    return false;
  }

  return true;
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
