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
  aiContextId?: string;
};

export type ProjectBrief = {
  id: string;
  name: string;
  projectType: "product_system" | "personal_build";
  summary: string;
  context?: string;
  build?: string;
  keyDecisions?: string[];
  significance?: string;
  why?: string;
  status: string;
  link?: string;
  tags: string[];
  relatedRoleIds: string[];
};

export type AIContextExplainer = {
  id: string;
  roleId: string;
  headline: string;
  summary: string;
  // Project- or portfolio-level contexts shown in "View AI Context".
  projectContexts?: {
    id: string;
    title: string;
    situation: string;
    approach: string;
    work: string;
    lessonsLearned?: string;
  }[];
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

export type Credential = {
  id: string;
  featured?: boolean;
  imagePath: string;
  title: string;
  issuer: string;
  completedDate: string;
  expirationDate: string;
  verificationUrl: string;
  summary: string;
  validatedAreas: string[];
  tags: string[];
};

export type ContentDocument = {
  id: string;
  sourceType:
    | "resume"
    | "project"
    | "case_study"
    | "faq"
    | "ai_context"
    | "build_doc"
    | "credential";
  title: string;
  section: string;
  text: string;
  tags: string[];
  metadata?: {
    startDate?: string;
    endDate?: string;
    relatedRoleId?: string;
    company?: string;
    roleTitle?: string;
    expirationDate?: string;
  };
};

export type EvidenceChunk = ContentDocument & {
  embedding: number[];
};
