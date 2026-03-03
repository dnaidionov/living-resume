export type Citation = {
  sourceId: string;
  title: string;
  section: string;
};

export type ResumeRole = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate?: string;
  summary: string;
  achievements: string[];
  skills: string[];
  tags: string[];
  aiContextId: string;
};

export type ProjectBrief = {
  id: string;
  name: string;
  summary: string;
  problem: string;
  actions: string[];
  outcomes: string[];
  tags: string[];
  relatedRoleIds: string[];
};

export type AIContextExplainer = {
  id: string;
  roleId: string;
  headline: string;
  summary: string;
  situation: string;
  goal: string;
  constraints: string[];
  approach: string[];
  keyDecisions: string[];
  execution: string[];
  outcomes: string[];
  metrics: string[];
  skillsDemonstrated: string[];
  relatedProjectIds: string[];
  citations: Citation[];
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type BuildDoc = {
  id: string;
  title: string;
  summary: string;
  body: string;
};

export type ContentDocument = {
  id: string;
  sourceType:
    | "resume"
    | "project"
    | "case_study"
    | "faq"
    | "ai_context"
    | "build_doc";
  title: string;
  section: string;
  text: string;
  tags: string[];
};

export type EvidenceChunk = ContentDocument & {
  embedding: number[];
};
