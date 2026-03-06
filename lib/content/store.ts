import type {
  AIContextExplainer,
  BuildDoc,
  ContentDocument,
  FaqItem,
  ProjectBrief,
  ResumeRole
} from "@/types/content";
import { loadJsonFile } from "@/lib/content/load-json";
import type { ContentStore } from "@/types/contracts";

const paths = {
  roles: "content/resume/roles.json",
  projects: "content/projects/projects.json",
  caseStudies: "content/case-studies/case-studies.json",
  faq: "content/faq/faq.json",
  explainers: "content/ai-context/explainers.json",
  buildDocs: "content/build-docs/build-docs.json"
} as const;

export async function loadRoles(): Promise<ResumeRole[]> {
  return loadJsonFile<ResumeRole[]>(paths.roles);
}

export async function loadProjects(): Promise<ProjectBrief[]> {
  return loadJsonFile<ProjectBrief[]>(paths.projects);
}

export async function loadCaseStudies(): Promise<Array<{ id: string; title: string; summary: string; body: string }>> {
  return loadJsonFile(paths.caseStudies);
}

export async function loadFaq(): Promise<FaqItem[]> {
  return loadJsonFile<FaqItem[]>(paths.faq);
}

export async function loadExplainers(): Promise<AIContextExplainer[]> {
  return loadJsonFile<AIContextExplainer[]>(paths.explainers);
}

export async function loadBuildDocs(): Promise<BuildDoc[]> {
  return loadJsonFile<BuildDoc[]>(paths.buildDocs);
}

export async function buildDocuments(): Promise<ContentDocument[]> {
  const [roles, projects, explainers, faq, buildDocs, caseStudies] = await Promise.all([
    loadRoles(),
    loadProjects(),
    loadExplainers(),
    loadFaq(),
    loadBuildDocs(),
    loadCaseStudies()
  ]);

  return [
    ...roles.flatMap((role) => [
      {
        id: `role-${role.id}-summary`,
        sourceType: "resume" as const,
        title: `${role.title} at ${role.company}`,
        section: "summary",
        text: role.summary,
        tags: role.tags
      },
      ...role.achievements.map((achievement, index) => ({
        id: `role-${role.id}-achievement-${index + 1}`,
        sourceType: "resume" as const,
        title: `${role.title} at ${role.company}`,
        section: `achievement-${index + 1}`,
        text: achievement,
        tags: role.tags
      }))
    ]),
    ...projects.flatMap((project) => [
      {
        id: `project-${project.id}-summary`,
        sourceType: "project" as const,
        title: project.name,
        section: "summary",
        text: project.summary,
        tags: project.tags
      },
      {
        id: `project-${project.id}-problem`,
        sourceType: "project" as const,
        title: project.name,
        section: "problem",
        text: project.problem,
        tags: project.tags
      },
      ...project.actions.map((action, index) => ({
        id: `project-${project.id}-action-${index + 1}`,
        sourceType: "project" as const,
        title: project.name,
        section: `action-${index + 1}`,
        text: action,
        tags: project.tags
      }))
    ]),
    ...explainers.flatMap((explainer) => [
      {
        id: `ai-context-${explainer.id}-summary`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: "summary",
        text: explainer.summary,
        tags: explainer.skillsDemonstrated
      },
      {
        id: `ai-context-${explainer.id}-situation`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: "situation",
        text: explainer.situation,
        tags: explainer.skillsDemonstrated
      },
      {
        id: `ai-context-${explainer.id}-goal`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: "goal",
        text: explainer.goal,
        tags: explainer.skillsDemonstrated
      },
      ...explainer.outcomes.map((outcome, index) => ({
        id: `ai-context-${explainer.id}-outcome-${index + 1}`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: `outcome-${index + 1}`,
        text: outcome,
        tags: explainer.skillsDemonstrated
      })),
      ...(explainer.projectContexts ?? []).flatMap((projectContext) => [
        {
          id: `ai-context-${explainer.id}-${projectContext.id}-situation`,
          sourceType: "ai_context" as const,
          title: `${explainer.headline} · ${projectContext.title}`,
          section: "project-situation",
          text: projectContext.situation,
          tags: explainer.skillsDemonstrated
        },
        {
          id: `ai-context-${explainer.id}-${projectContext.id}-approach`,
          sourceType: "ai_context" as const,
          title: `${explainer.headline} · ${projectContext.title}`,
          section: "project-approach",
          text: projectContext.approach,
          tags: explainer.skillsDemonstrated
        },
        {
          id: `ai-context-${explainer.id}-${projectContext.id}-work`,
          sourceType: "ai_context" as const,
          title: `${explainer.headline} · ${projectContext.title}`,
          section: "project-work",
          text: projectContext.work,
          tags: explainer.skillsDemonstrated
        },
        ...(projectContext.lessonsLearned
          ? [
              {
                id: `ai-context-${explainer.id}-${projectContext.id}-lessons-learned`,
                sourceType: "ai_context" as const,
                title: `${explainer.headline} · ${projectContext.title}`,
                section: "project-lessons-learned",
                text: projectContext.lessonsLearned,
                tags: explainer.skillsDemonstrated
              }
            ]
          : [])
      ])
    ]),
    ...faq.map((item) => ({
      id: `faq-${item.id}`,
      sourceType: "faq" as const,
      title: item.question,
      section: "answer",
      text: item.answer,
      tags: ["faq"]
    })),
    ...buildDocs.map((doc) => ({
      id: `build-${doc.id}`,
      sourceType: "build_doc" as const,
      title: doc.title,
      section: "body",
      text: `${doc.summary} ${doc.body}`,
      tags: ["build", "architecture"]
    })),
    ...caseStudies.map((doc) => ({
      id: `case-study-${doc.id}`,
      sourceType: "case_study" as const,
      title: doc.title,
      section: "body",
      text: `${doc.summary} ${doc.body}`,
      tags: ["case-study"]
    }))
  ];
}

export const fileContentStore: ContentStore = {
  async getRole(roleId) {
    const roles = await loadRoles();
    return roles.find((role) => role.id === roleId) ?? null;
  },
  async getAIContext(roleId) {
    const explainers = await loadExplainers();
    return explainers.find((item) => item.roleId === roleId) ?? null;
  },
  async listDocuments() {
    return buildDocuments();
  }
};
