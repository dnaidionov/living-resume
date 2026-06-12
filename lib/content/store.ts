import type {
  AIContextExplainer,
  BuildDoc,
  ContentDocument,
  Credential,
  FaqItem,
  ProjectBrief,
  ResumeRole
} from "@/types/content";
import type { ContentStore } from "@/types/contracts";
import roles from "@/content/resume/roles.json";
import projects from "@/content/projects/projects.json";
import caseStudies from "@/content/case-studies/case-studies.json";
import faq from "@/content/faq/faq.json";
import explainers from "@/content/ai-context/explainers.json";
import buildDocs from "@/content/build-docs/build-docs.json";
import credentials from "@/content/credentials/credentials.json";

export async function loadRoles(): Promise<ResumeRole[]> {
  return roles as ResumeRole[];
}

export async function loadProjects(): Promise<ProjectBrief[]> {
  return projects as ProjectBrief[];
}

export async function loadCaseStudies(): Promise<Array<{ id: string; title: string; summary: string; body: string }>> {
  return caseStudies as Array<{ id: string; title: string; summary: string; body: string }>;
}

export async function loadFaq(): Promise<FaqItem[]> {
  return faq as FaqItem[];
}

export async function loadExplainers(): Promise<AIContextExplainer[]> {
  return explainers as AIContextExplainer[];
}

export async function loadBuildDocs(): Promise<BuildDoc[]> {
  return buildDocs as BuildDoc[];
}

export async function loadCredentials(): Promise<Credential[]> {
  return credentials as Credential[];
}

export async function buildDocuments(): Promise<ContentDocument[]> {
  const [roles, projects, explainers, faq, buildDocs, caseStudies, credentials] = await Promise.all([
    loadRoles(),
    loadProjects(),
    loadExplainers(),
    loadFaq(),
    loadBuildDocs(),
    loadCaseStudies(),
    loadCredentials()
  ]);
  const roleDateById = new Map(roles.map((role) => [role.id, { startDate: role.startDate, endDate: role.endDate }]));
  const roleMetaById = new Map(roles.map((role) => [role.id, { company: role.company, roleTitle: role.title }]));

  return [
    ...roles.flatMap((role) => [
      {
        id: `role-${role.id}-summary`,
        sourceType: "resume" as const,
        title: `${role.title} at ${role.company}`,
        section: "summary",
        text: role.summary,
        tags: role.tags,
        metadata: {
          startDate: role.startDate,
          endDate: role.endDate,
          relatedRoleId: role.id,
          company: role.company,
          roleTitle: role.title
        }
      },
      ...role.achievements.map((achievement, index) => ({
        id: `role-${role.id}-achievement-${index + 1}`,
        sourceType: "resume" as const,
        title: `${role.title} at ${role.company}`,
        section: `achievement-${index + 1}`,
        text: achievement,
        tags: role.tags,
        metadata: {
          startDate: role.startDate,
          endDate: role.endDate,
          relatedRoleId: role.id,
          company: role.company,
          roleTitle: role.title
        }
      }))
    ]),
    ...projects.flatMap((project) => {
      const metadata = buildProjectMetadata(project.relatedRoleIds, roleDateById, roleMetaById);

      return [
        {
          id: `project-${project.id}-summary`,
          sourceType: "project" as const,
          title: project.name,
          section: "summary",
          text: project.summary,
          tags: project.tags,
          metadata
        },
        ...(project.context
          ? [
              {
                id: `project-${project.id}-context`,
                sourceType: "project" as const,
                title: project.name,
                section: "context",
                text: project.context,
                tags: project.tags,
                metadata
              }
            ]
          : []),
        ...(project.build
          ? [
              {
                id: `project-${project.id}-build`,
                sourceType: "project" as const,
                title: project.name,
                section: "build",
                text: project.build,
                tags: project.tags,
                metadata
              }
            ]
          : []),
        ...(project.keyDecisions ?? []).map((decision, index) => ({
          id: `project-${project.id}-decision-${index + 1}`,
          sourceType: "project" as const,
          title: project.name,
          section: `decision-${index + 1}`,
          text: decision,
          tags: project.tags,
          metadata
        })),
        ...(project.significance
          ? [
              {
                id: `project-${project.id}-significance`,
                sourceType: "project" as const,
                title: project.name,
                section: "significance",
                text: project.significance,
                tags: project.tags,
                metadata
              }
            ]
          : []),
        ...(project.why
          ? [
              {
                id: `project-${project.id}-why`,
                sourceType: "project" as const,
                title: project.name,
                section: "why",
                text: project.why,
                tags: project.tags,
                metadata
              }
            ]
          : []),
        {
          id: `project-${project.id}-status`,
          sourceType: "project" as const,
          title: project.name,
          section: "status",
          text: project.status,
          tags: project.tags,
          metadata
        }
      ];
    }),
    ...explainers.flatMap((explainer) => [
      {
        id: `ai-context-${explainer.id}-summary`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: "summary",
        text: explainer.summary,
        tags: explainer.skillsDemonstrated,
        metadata: {
          startDate: roleDateById.get(explainer.roleId)?.startDate,
          endDate: roleDateById.get(explainer.roleId)?.endDate,
          relatedRoleId: explainer.roleId,
          company: roleMetaById.get(explainer.roleId)?.company,
          roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
        }
      },
      {
        id: `ai-context-${explainer.id}-situation`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: "situation",
        text: explainer.situation,
        tags: explainer.skillsDemonstrated,
        metadata: {
          startDate: roleDateById.get(explainer.roleId)?.startDate,
          endDate: roleDateById.get(explainer.roleId)?.endDate,
          relatedRoleId: explainer.roleId,
          company: roleMetaById.get(explainer.roleId)?.company,
          roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
        }
      },
      {
        id: `ai-context-${explainer.id}-goal`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: "goal",
        text: explainer.goal,
        tags: explainer.skillsDemonstrated,
        metadata: {
          startDate: roleDateById.get(explainer.roleId)?.startDate,
          endDate: roleDateById.get(explainer.roleId)?.endDate,
          relatedRoleId: explainer.roleId,
          company: roleMetaById.get(explainer.roleId)?.company,
          roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
        }
      },
      ...explainer.outcomes.map((outcome, index) => ({
        id: `ai-context-${explainer.id}-outcome-${index + 1}`,
        sourceType: "ai_context" as const,
        title: explainer.headline,
        section: `outcome-${index + 1}`,
        text: outcome,
        tags: explainer.skillsDemonstrated,
        metadata: {
          startDate: roleDateById.get(explainer.roleId)?.startDate,
          endDate: roleDateById.get(explainer.roleId)?.endDate,
          relatedRoleId: explainer.roleId,
          company: roleMetaById.get(explainer.roleId)?.company,
          roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
        }
      })),
      ...(explainer.projectContexts ?? []).flatMap((projectContext) => [
        {
          id: `ai-context-${explainer.id}-${projectContext.id}-situation`,
          sourceType: "ai_context" as const,
          title: `${explainer.headline} · ${projectContext.title}`,
          section: "project-situation",
          text: projectContext.situation,
          tags: explainer.skillsDemonstrated,
          metadata: {
            startDate: roleDateById.get(explainer.roleId)?.startDate,
            endDate: roleDateById.get(explainer.roleId)?.endDate,
            relatedRoleId: explainer.roleId,
            company: roleMetaById.get(explainer.roleId)?.company,
            roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
          }
        },
        {
          id: `ai-context-${explainer.id}-${projectContext.id}-approach`,
          sourceType: "ai_context" as const,
          title: `${explainer.headline} · ${projectContext.title}`,
          section: "project-approach",
          text: projectContext.approach,
          tags: explainer.skillsDemonstrated,
          metadata: {
            startDate: roleDateById.get(explainer.roleId)?.startDate,
            endDate: roleDateById.get(explainer.roleId)?.endDate,
            relatedRoleId: explainer.roleId,
            company: roleMetaById.get(explainer.roleId)?.company,
            roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
          }
        },
        {
          id: `ai-context-${explainer.id}-${projectContext.id}-work`,
          sourceType: "ai_context" as const,
          title: `${explainer.headline} · ${projectContext.title}`,
          section: "project-work",
          text: projectContext.work,
          tags: explainer.skillsDemonstrated,
          metadata: {
            startDate: roleDateById.get(explainer.roleId)?.startDate,
            endDate: roleDateById.get(explainer.roleId)?.endDate,
            relatedRoleId: explainer.roleId,
            company: roleMetaById.get(explainer.roleId)?.company,
            roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
          }
        },
        ...(projectContext.lessonsLearned
          ? [
              {
                id: `ai-context-${explainer.id}-${projectContext.id}-lessons-learned`,
                sourceType: "ai_context" as const,
                title: `${explainer.headline} · ${projectContext.title}`,
                section: "project-lessons-learned",
                text: projectContext.lessonsLearned,
                tags: explainer.skillsDemonstrated,
                metadata: {
                  startDate: roleDateById.get(explainer.roleId)?.startDate,
                  endDate: roleDateById.get(explainer.roleId)?.endDate,
                  relatedRoleId: explainer.roleId,
                  company: roleMetaById.get(explainer.roleId)?.company,
                  roleTitle: roleMetaById.get(explainer.roleId)?.roleTitle
                }
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
    })),
    ...credentials.map((credential) => ({
      id: `credential-${credential.id}`,
      sourceType: "credential" as const,
      title: credential.title,
      section: "credential",
      text: `${credential.issuer} credential completed ${credential.completedDate}. ${credential.summary} Validated areas: ${credential.validatedAreas.join(", ")}. Verification: ${credential.verificationUrl}`,
      tags: credential.tags,
      metadata: {
        expirationDate: credential.expirationDate
      }
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

function buildProjectMetadata(
  relatedRoleIds: string[],
  roleDateById: Map<string, { startDate: string; endDate?: string }>,
  roleMetaById: Map<string, { company: string; roleTitle: string }>
) {
  const datedRoles = relatedRoleIds
    .map((roleId) => ({
      roleId,
      dates: roleDateById.get(roleId),
      meta: roleMetaById.get(roleId)
    }))
    .filter((item) => item.dates);

  if (datedRoles.length === 0) {
    return undefined;
  }

  datedRoles.sort((left, right) => compareDateStrings(right.dates?.endDate ?? right.dates?.startDate, left.dates?.endDate ?? left.dates?.startDate));
  const latest = datedRoles[0];

  return {
    startDate: latest?.dates?.startDate,
    endDate: latest?.dates?.endDate,
    relatedRoleId: latest?.roleId,
    company: latest?.meta?.company,
    roleTitle: latest?.meta?.roleTitle
  };
}

function compareDateStrings(left: string | undefined, right: string | undefined): number {
  const normalizedLeft = left ?? "";
  const normalizedRight = right ?? "";
  if (normalizedLeft === normalizedRight) {
    return 0;
  }
  return normalizedLeft > normalizedRight ? 1 : -1;
}
