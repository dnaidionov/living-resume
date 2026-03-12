import type { Citation, EvidenceChunk } from "@/types/content";

export type ChatMode = "auto" | "resume_qa" | "fit_analysis" | "build_process";

export type ChatTurn = {
  role: "user" | "assistant";
  text: string;
};

export type ChatRequest = {
  message: string;
  mode?: ChatMode;
  sessionId: string;
  history?: ChatTurn[];
};

export type ChatAnswer = {
  answer: string;
  citations: Citation[];
  confidence: "high" | "medium" | "low";
};

export type RoleInput =
  | { kind: "text"; text: string }
  | { kind: "file"; fileId: string; mimeType: string }
  | { kind: "url"; url: string; content?: string };

export type FitPresentationMode = "scorecard" | "recruiter_brief";

export type FitVerdict =
  | "strong_fit_lets_talk"
  | "probably_a_good_fit"
  | "probably_not_your_person";

export type RoleRequirementCategory = "requirement" | "function" | "expectation" | "mission";

export type RoleRequirementPriority = "must_have" | "important" | "nice_to_have";

export type ExtractedRoleRequirement = {
  text: string;
  category: RoleRequirementCategory;
  priority: RoleRequirementPriority;
};

export type FitDimension = {
  name: "core_match" | "execution_scope" | "leadership_collaboration" | "context_readiness";
  score: number;
  rationale: string;
  evidence: string[];
};

export type MatchBullet = {
  requirement: string;
  support: string;
  relatedRequirements?: string[];
  citations?: Citation[];
};

export type GapBullet = {
  requirement: string;
  gap: string;
  citations?: Citation[];
};

export type TransferBullet = {
  skillOrExperience: string;
  relevance: string;
  citations?: Citation[];
};

export type RecruiterBriefPresentation = {
  mode: "recruiter_brief";
  overallMatch: {
    verdict: FitVerdict;
    label:
      | "Strong Fit - Let's talk"
      | "Probably a Good Fit"
      | "Honest Assessment - Probably Not Your Person";
  };
  whereIMatch?: MatchBullet[];
  gapsToNote?: GapBullet[];
  whereIDontFit?: GapBullet[];
  whatDoesTransfer?: TransferBullet[];
  recommendation: string;
};

export type ScorecardPresentation = {
  mode: "scorecard";
  overallSummary: string;
  overallScore: number;
  dimensions: FitDimension[];
  strengths: string[];
  gaps: string[];
  transferableAdvantages: string[];
  interviewAngles: string[];
};

export type InternalFitEvaluation = {
  overallSummary: string;
  overallScore: number;
  dimensions: FitDimension[];
  strengths: string[];
  gaps: string[];
  transferableAdvantages: string[];
  interviewAngles: string[];
};

export type FitAnalysisResult = {
  presentation: RecruiterBriefPresentation | ScorecardPresentation;
  internal: InternalFitEvaluation;
  citations: Citation[];
  confidence: "high" | "medium" | "low";
  extractionWarnings?: string[];
  metadata?: {
    evaluatorVersion: string;
    inputKind: "text" | "url" | "file";
    presentationMode: FitPresentationMode;
    stageVersions?: {
      requirementExtraction: string;
      retrieval: string;
      generation: string;
    };
  };
};

export type FitAnalysisRequest = {
  roleInput: RoleInput;
  sessionId: string;
  presentationMode?: FitPresentationMode;
};

export type ModelInput = {
  prompt: string;
  evidence: EvidenceChunk[];
  mode: ChatMode;
  history?: ChatTurn[];
};

export type ModelOutput = ChatAnswer;
