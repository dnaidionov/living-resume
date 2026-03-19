import type {
  AIContextExplainer,
  ContentDocument,
  EvidenceChunk,
  ResumeRole
} from "@/types/content";
import type {
  ExtractedRoleRequirement,
  FitAnalysisResult,
  FitPresentationMode,
  ModelInput,
  ModelOutput,
  RoleInput
} from "@/types/ai";

export type ContentStore = {
  getRole(roleId: string): Promise<ResumeRole | null>;
  getAIContext(roleId: string): Promise<AIContextExplainer | null>;
  listDocuments(): Promise<ContentDocument[]>;
};

export type RetrievalStore = {
  searchEvidence(
    query: string,
    mode: "resume_qa" | "fit_analysis" | "build_process"
  ): Promise<EvidenceChunk[]>;
  searchEvidenceBatch(
    queries: string[],
    mode: "resume_qa" | "fit_analysis" | "build_process"
  ): Promise<EvidenceChunk[][]>;
};

export type ChatModel = {
  generateAnswer(input: ModelInput): Promise<ModelOutput>;
};

export type FitAnalysisService = {
  analyze(roleInput: RoleInput, sessionId: string, presentationMode?: FitPresentationMode): Promise<FitAnalysisResult>;
};

export type RequirementExtractionService = {
  extract(roleText: string): Promise<ExtractedRoleRequirement[]>;
};
