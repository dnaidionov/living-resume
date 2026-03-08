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
  | { kind: "url"; url: string };

export type FitDimension = {
  name: "core_match" | "execution_scope" | "leadership_collaboration" | "context_readiness";
  score: number;
  rationale: string;
  evidence: string[];
};

export type FitAnalysisResult = {
  overallSummary: string;
  overallScore: number;
  dimensions: FitDimension[];
  strengths: string[];
  gaps: string[];
  transferableAdvantages: string[];
  interviewAngles: string[];
  confidence: "high" | "medium" | "low";
  citations: Citation[];
  extractionWarnings?: string[];
  metadata?: {
    evaluatorVersion: string;
    inputKind: "text" | "url" | "file";
  };
};

export type ModelInput = {
  prompt: string;
  evidence: EvidenceChunk[];
  mode: ChatMode;
  history?: ChatTurn[];
};

export type ModelOutput = ChatAnswer;
