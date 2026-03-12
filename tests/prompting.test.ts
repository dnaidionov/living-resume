import test from "node:test";
import assert from "node:assert/strict";
import {
  assembleFitAnalysisResult,
  buildFallbackFitAnalysisResponse,
  buildFitAnalysisUserPrompt,
  extractRoleRequirements
} from "@/lib/ai/prompting";
import type { ExtractedRoleRequirement } from "@/types/ai";
import type { EvidenceChunk } from "@/types/content";

const evidence: EvidenceChunk[] = [
  {
    id: "role-1",
    sourceType: "resume",
    title: "Senior Product Manager at EPAM",
    section: "achievement-1",
    text: "Led AI evaluation and developer experience initiatives.",
    tags: ["ai", "product"],
    embedding: [1, 0, 0]
  },
  {
    id: "project-1",
    sourceType: "project",
    title: "Living Resume",
    section: "summary",
    text: "Built a grounded resume experience with retrieval and fit analysis.",
    tags: ["ai", "execution"],
    embedding: [0, 1, 0]
  }
];

const requirements: ExtractedRoleRequirement[] = [
  {
    text: "Own roadmap strategy and prioritization across the product area.",
    category: "function",
    priority: "must_have"
  },
  {
    text: "Lead cross-functional stakeholder alignment across engineering and design.",
    category: "function",
    priority: "important"
  }
];

test("assembleFitAnalysisResult preserves internal scorecard and recruiter brief metadata", () => {
  const result = assembleFitAnalysisResult({
    input: {
      internal: {
        overallSummary: "Strong top-of-funnel qualification for the role.",
        overallScore: 8,
        dimensions: [
          {
            name: "core_match",
            score: 4,
            rationale: "Direct product ownership evidence is present.",
            evidence: ["Senior Product Manager at EPAM"]
          }
        ],
        strengths: ["Grounded product strategy."],
        gaps: ["Validate one specialized context requirement."],
        transferableAdvantages: ["Strong cross-functional execution."],
        interviewAngles: ["Ask about roadmap ownership."]
      },
      confidence: "high"
    },
    requirements,
    evidence,
    inputKind: "text",
    presentationMode: "recruiter_brief",
    evaluatorVersion: "v3-test"
  });

  assert.equal(result.internal.dimensions.length, 4);
  assert.equal(result.internal.dimensions[0]?.name, "core_match");
  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.citations.length, 2);
  assert.equal(result.metadata?.inputKind, "text");
  assert.equal(result.metadata?.evaluatorVersion, "v3-test");
  assert.equal(result.metadata?.presentationMode, "recruiter_brief");
});

test("extractRoleRequirements marks explicit must-haves and nice-to-haves", () => {
  const requirements = extractRoleRequirements(`
    Must have experience owning SaaS product roadmaps.
    Preferred familiarity with healthcare workflows.
    Lead cross-functional execution with engineering and design.
  `);

  const priorities = requirements.map((item) => item.priority);
  assert.ok(priorities.includes("must_have"));
  assert.ok(priorities.includes("nice_to_have"));
  assert.ok(priorities.includes("important"));
});

test("extractRoleRequirements filters titles, locations, and boilerplate", () => {
  const requirements = extractRoleRequirements(`
    Senior Product Manager, Planner
    Mountain View, California, United States; San Francisco
    Bring fully autonomous driving technology to market.
    Develop a roadmap and determine product requirements for planner.
    Equal opportunity employer statement and apply now content.
  `);

  const labels = requirements.map((item) => item.text);
  assert.equal(labels.includes("Senior Product Manager, Planner"), false);
  assert.equal(labels.some((item) => /Mountain View|California|San Francisco/i.test(item)), false);
  assert.equal(labels.some((item) => /Equal opportunity|apply now/i.test(item)), false);
  assert.ok(labels.some((item) => /autonomous driving technology to market/i.test(item)));
  assert.ok(labels.some((item) => /roadmap and determine product requirements/i.test(item)));
});

test("fit-analysis prompt keeps anti-false-negative logic in the hidden prompt", () => {
  const prompt = buildFitAnalysisUserPrompt(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    requirements,
    evidence,
    "recruiter_brief"
  );

  assert.match(prompt, /A role that does not mention AI should not be treated as lower fit/);
  assert.match(prompt, /Strong Fit - Let's talk, Probably a Good Fit, Honest Assessment - Probably Not Your Person/);
  assert.match(prompt, /If the role is clearly outside product management/);
  assert.match(prompt, /Do not count pre-2023 AI\/ML or chatbot work as direct evidence/);
});

test("fallback recruiter brief does not mention preferred domains or absent AI language", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    requirements,
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const brief = result.presentation;
  const visibleText = [
    brief.overallMatch.label,
    ...(brief.whereIMatch ?? []).map((item) => `${item.requirement} ${item.support}`),
    ...(brief.gapsToNote ?? []).map((item) => `${item.requirement} ${item.gap}`),
    ...(brief.whereIDontFit ?? []).map((item) => `${item.requirement} ${item.gap}`),
    ...(brief.whatDoesTransfer ?? []).map((item) => `${item.skillOrExperience} ${item.relevance}`),
    brief.recommendation
  ].join(" ");

  assert.doesNotMatch(visibleText, /preferred domains?/i);
  assert.doesNotMatch(visibleText, /absence of ai language/i);
});

test("fallback fit-analysis metadata exposes stage versions", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    requirements,
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.metadata?.stageVersions?.requirementExtraction, "v1-heuristic-fallback");
  assert.equal(result.metadata?.stageVersions?.generation, "v2-fallback-brief");
});

test("strong-fit recruiter brief uses requirement titles with evidence text and a non-redundant recommendation", () => {
  const strongEvidence: EvidenceChunk[] = [
    {
      id: "strong-1",
      sourceType: "resume",
      title: "Senior Product Manager at EPAM",
      section: "achievement-1",
      text: "Led roadmap strategy and cross-functional stakeholder alignment across enterprise platforms.",
      tags: ["product", "roadmap", "leadership", "enterprise"],
      metadata: { company: "EPAM", roleTitle: "Senior Product Manager", startDate: "2023-01", endDate: "2025-01" },
      embedding: [1, 0, 0]
    },
    {
      id: "strong-2",
      sourceType: "resume",
      title: "Product Strategist at Modus Create",
      section: "achievement-1",
      text: "Ran product discovery workshops, defined requirements, and translated business outcomes into scoped delivery plans.",
      tags: ["discovery", "requirements", "strategy"],
      metadata: { company: "Modus Create", roleTitle: "Product Strategist", startDate: "2019-01", endDate: "2021-01" },
      embedding: [0, 1, 0]
    },
    {
      id: "strong-3",
      sourceType: "resume",
      title: "Product Manager at PwC + Google for Work Innovation Lab",
      section: "achievement-1",
      text: "Drove delivery execution, rollout, training, and measurable operating-model outcomes across enterprise teams.",
      tags: ["delivery", "rollout", "execution"],
      metadata: { company: "PwC + Google for Work Innovation Lab", roleTitle: "Product Manager", startDate: "2017-01", endDate: "2018-12" },
      embedding: [0, 0, 1]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager
    Must have ownership of roadmap strategy.
    Must have cross-functional stakeholder alignment.
    Must have delivery execution across product teams.
    Must have measurable business outcomes.
    Must have product discovery leadership.`,
    extractRoleRequirements(`Senior Product Manager
    Must have ownership of roadmap strategy.
    Must have cross-functional stakeholder alignment.
    Must have delivery execution across product teams.
    Must have measurable business outcomes.
    Must have product discovery leadership.`),
    strongEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const brief = result.presentation;

  if (brief.overallMatch.verdict !== "strong_fit_lets_talk" && brief.overallMatch.verdict !== "probably_a_good_fit") {
    assert.fail("Expected a positive-fit recruiter brief.");
  }

  assert.ok((brief.whereIMatch?.length ?? 0) >= 3);
  assert.ok((brief.whereIMatch?.[0]?.requirement ?? "").length > 0);
  assert.ok((brief.whereIMatch?.[0]?.support ?? "").length > 0);
  assert.match(brief.whereIMatch?.[0]?.support ?? "", /^At .+, I /);
  assert.doesNotMatch(brief.whereIMatch?.[0]?.support ?? "", /Sales and support teams had thousands of documents/i);
  assert.doesNotMatch(brief.recommendation, /The evidence points|The strongest support comes from/i);
});

test("company mission intro is not promoted ahead of actual role requirements", () => {
  const jd = `At Netflix, our mission is to entertain the world. Together, we are writing the next episode.
  Define and execute the product vision and roadmap for enterprise systems solutions.
  Conduct buy vs. build analysis for third-party tools.
  Gather requirements from internal stakeholders and translate them into product features.`;

  const result = buildFallbackFitAnalysisResponse(
    jd,
    extractRoleRequirements(jd),
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const firstRequirement = result.presentation.whereIMatch?.[0]?.requirement ?? "";
  assert.doesNotMatch(firstRequirement, /our mission is to entertain the world|writing the next episode/i);
  assert.match(firstRequirement, /product vision|roadmap|buy vs\. build|requirements from/i);
});

test("non-product roles are forced into a negative fit", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior DevOps Engineer
    Own Kubernetes cluster operations.
    Manage AWS infrastructure and deployment reliability.
    Lead incident response and SRE practice improvements.`,
    extractRoleRequirements(`Senior DevOps Engineer
    Own Kubernetes cluster operations.
    Manage AWS infrastructure and deployment reliability.
    Lead incident response and SRE practice improvements.`),
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  assert.ok((result.presentation.whereIDontFit?.length ?? 0) >= 3);
});

test("positive-fit bullets do not reuse the same evidence as Same as above", () => {
  const duplicateEvidence: EvidenceChunk[] = [
    {
      id: "role-epam-1",
      sourceType: "resume",
      title: "Senior Product Manager at EPAM",
      section: "achievement-1",
      text: "Led roadmap strategy, cross-functional alignment, and delivery governance.",
      tags: ["product", "roadmap", "leadership"],
      embedding: [1, 0, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager
    Own roadmap strategy.
    Lead cross-functional stakeholder alignment.
    Drive delivery execution.`,
    extractRoleRequirements(`Senior Product Manager
    Own roadmap strategy.
    Lead cross-functional stakeholder alignment.
    Drive delivery execution.`),
    duplicateEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const supports = (result.presentation.whereIMatch ?? []).map((item) => item.support);
  assert.ok(supports.length >= 1);
  assert.equal(new Set(supports).size, supports.length);
  assert.ok(supports.every((item) => !/Same as above/i.test(item)));
});

test("where I match prefers alternative evidence before reusing the same proof for unrelated bullets", () => {
  const broaderEvidence: EvidenceChunk[] = [
    {
      id: "role-roadmap",
      sourceType: "resume",
      title: "Senior Product Manager at EPAM",
      section: "achievement-1",
      text: "Led roadmap strategy and cross-functional alignment for enterprise platforms.",
      tags: ["product", "roadmap", "leadership"],
      metadata: { company: "EPAM", roleTitle: "Senior Product Manager" },
      embedding: [1, 0, 0]
    },
    {
      id: "role-analysis",
      sourceType: "resume",
      title: "Product Manager at PwC + Google for Work Innovation Lab",
      section: "achievement-1",
      text: "Led workflow redesign and buy-versus-build evaluation across multiple vendors and operating models.",
      tags: ["strategy", "analysis", "execution"],
      metadata: { company: "PwC + Google for Work Innovation Lab", roleTitle: "Product Manager" },
      embedding: [0, 1, 0]
    }
  ];

  const jd = `Define and execute the product vision and roadmap for enterprise systems solutions.
  Conduct buy vs. build analysis for third-party tools.`;

  const result = buildFallbackFitAnalysisResponse(
    jd,
    extractRoleRequirements(jd),
    broaderEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const bullets = result.presentation.whereIMatch ?? [];
  assert.ok(bullets.length >= 2);
  assert.notEqual(bullets[0]?.support, bullets[1]?.support);
});

test("numeric HTML entities are decoded before requirement extraction", () => {
  const requirements = extractRoleRequirements(`
    6&#43; years of product management experience with a proven track record in data integration and enterprise systems.
    Gather requirements from diverse internal stakeholders and translate them into actionable product features.
  `);

  const labels = requirements.map((item) => item.text);
  assert.ok(labels.some((item) => /6\+ years of product management experience/i.test(item)));
  assert.equal(labels.some((item) => /&#43;/.test(item)), false);
});

test("where possible, newer comparable evidence is preferred", () => {
  const datedEvidence: EvidenceChunk[] = [
    {
      id: "older-roadmap",
      sourceType: "resume",
      title: "Product Manager at OlderCo",
      section: "achievement-1",
      text: "Led roadmap strategy and enterprise stakeholder alignment.",
      tags: ["product", "roadmap", "leadership"],
      metadata: {
        company: "OlderCo",
        roleTitle: "Product Manager",
        startDate: "2016-01",
        endDate: "2017-12"
      },
      embedding: [1, 0, 0]
    },
    {
      id: "newer-roadmap",
      sourceType: "resume",
      title: "Senior Product Manager at NewerCo",
      section: "achievement-1",
      text: "Led roadmap strategy and enterprise stakeholder alignment.",
      tags: ["product", "roadmap", "leadership"],
      metadata: {
        company: "NewerCo",
        roleTitle: "Senior Product Manager",
        startDate: "2023-01",
        endDate: "2025-01"
      },
      embedding: [1, 0, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Define and execute the product vision and roadmap for enterprise systems solutions.`,
    extractRoleRequirements(`Define and execute the product vision and roadmap for enterprise systems solutions.`),
    datedEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.match(result.presentation.whereIMatch?.[0]?.support ?? "", /NewerCo/);
});

test("Vingis evidence is deprioritized when more concrete experience supports the same requirement", () => {
  const competingEvidence: EvidenceChunk[] = [
    {
      id: "vingis-role",
      sourceType: "resume",
      title: "Product Manager at Vingis",
      section: "achievement-1",
      text: "Led consulting engagements across startup and enterprise contexts, establishing repeatable discovery, roadmapping, and execution-alignment practices.",
      tags: ["consulting", "product", "delivery"],
      metadata: {
        company: "Vingis",
        roleTitle: "Product Manager",
        relatedRoleId: "vingis",
        startDate: "2016-01",
        endDate: "2020-12"
      },
      embedding: [1, 0, 0]
    },
    {
      id: "pwc-role",
      sourceType: "resume",
      title: "Product Manager at PwC + Google for Work Innovation Lab",
      section: "achievement-1",
      text: "Owned key discovery tracks for Field Service Optimization, including user interviews, usability studies, and prioritization workshops.",
      tags: ["enterprise", "discovery", "product"],
      metadata: {
        company: "PwC + Google for Work Innovation Lab",
        roleTitle: "Product Manager",
        relatedRoleId: "pwc-google-lab",
        startDate: "2016-06",
        endDate: "2017-05"
      },
      embedding: [0, 1, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Gather requirements from diverse internal stakeholders and translate them into actionable product features.`,
    extractRoleRequirements(`Gather requirements from diverse internal stakeholders and translate them into actionable product features.`),
    competingEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.match(result.presentation.whereIMatch?.[0]?.support ?? "", /PwC \+ Google for Work Innovation Lab/);
  assert.doesNotMatch(result.presentation.whereIMatch?.[0]?.support ?? "", /Vingis/);
});

test("generic product-management bullets use recent-role evidence phrasing", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Serve as the Product Manager/Product Owner for the SaaS business, leading discovery, writing requirements, grooming backlogs, and driving delivery with Engineering.`,
    extractRoleRequirements(`Serve as the Product Manager/Product Owner for the SaaS business, leading discovery, writing requirements, grooming backlogs, and driving delivery with Engineering.`),
    [
      {
        id: "recent-product-role",
        sourceType: "resume",
        title: "Senior Product Manager at EPAM",
        section: "achievement-1",
        text: "Led roadmap strategy and cross-functional alignment for enterprise platforms.",
        tags: ["product", "roadmap", "leadership"],
        metadata: {
          company: "EPAM",
          roleTitle: "Senior Product Manager",
          startDate: "2023-01",
          endDate: "2025-01"
        },
        embedding: [1, 0, 0]
      },
      {
        id: "recent-product-role-2",
        sourceType: "resume",
        title: "Product Strategist at Modus Create",
        section: "achievement-1",
        text: "Ran discovery workshops, defined requirements, and turned strategy into delivery-ready plans.",
        tags: ["product", "discovery", "requirements"],
        metadata: {
          company: "Modus Create",
          roleTitle: "Product Strategist",
          startDate: "2019-01",
          endDate: "2021-01"
        },
        embedding: [0, 1, 0]
      },
      {
        id: "generic-product-vingis",
        sourceType: "resume",
        title: "Product Manager at Vingis",
        section: "achievement-1",
        text: "Led consulting engagements across startup and enterprise contexts, establishing repeatable discovery, roadmapping, and execution-alignment practices.",
        tags: ["product", "delivery", "consulting"],
        metadata: {
          company: "Vingis",
          roleTitle: "Product Manager",
          relatedRoleId: "vingis",
          startDate: "2016-01",
          endDate: "2020-12"
        },
        embedding: [0, 0, 1]
      }
    ],
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.match(result.presentation.whereIMatch?.[0]?.support ?? "", /In my recent product roles, including EPAM and Modus Create/i);
  assert.doesNotMatch(result.presentation.whereIMatch?.[0]?.support ?? "", /roadmap strategy and cross-functional alignment/i);
  assert.doesNotMatch(result.presentation.whereIMatch?.[0]?.support ?? "", /Vingis/i);
});

test("generic product-management bullets omit Vingis when it is the only example", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Serve as the Product Manager/Product Owner for the SaaS business, leading discovery, writing requirements, grooming backlogs, and driving delivery with Engineering.`,
    extractRoleRequirements(`Serve as the Product Manager/Product Owner for the SaaS business, leading discovery, writing requirements, grooming backlogs, and driving delivery with Engineering.`),
    [
      {
        id: "generic-product-vingis",
        sourceType: "resume",
        title: "Product Manager at Vingis",
        section: "achievement-1",
        text: "Led consulting engagements across startup and enterprise contexts, establishing repeatable discovery, roadmapping, and execution-alignment practices.",
        tags: ["product", "delivery", "consulting"],
        metadata: {
          company: "Vingis",
          roleTitle: "Product Manager",
          relatedRoleId: "vingis",
          startDate: "2016-01",
          endDate: "2020-12"
        },
        embedding: [1, 0, 0]
      }
    ],
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.match(result.presentation.whereIMatch?.[0]?.support ?? "", /In my recent product roles, I led discovery/i);
  assert.doesNotMatch(result.presentation.whereIMatch?.[0]?.support ?? "", /including Vingis/i);
});

test("older AI evidence is not treated as direct modern LLM proof", () => {
  const oldAiEvidence: EvidenceChunk[] = [
    {
      id: "old-ai-1",
      sourceType: "resume",
      title: "Technical Product Manager at Soli",
      section: "achievement-1",
      text: "Led a conversational assistant and predictive analytics initiative for telecom campaigns.",
      tags: ["ai", "chatbot", "predictive analytics"],
      metadata: {
        startDate: "2011-08",
        endDate: "2013-03",
        relatedRoleId: "soli"
      },
      embedding: [1, 0, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager, AI
    Must have direct experience with LLM orchestration and evaluation frameworks.`,
    extractRoleRequirements(`Senior Product Manager, AI
    Must have direct experience with LLM orchestration and evaluation frameworks.`),
    oldAiEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.notEqual(result.presentation.overallMatch.verdict, "strong_fit_lets_talk");
  assert.ok((result.presentation.gapsToNote?.length ?? 0) > 0 || result.presentation.overallMatch.verdict === "probably_not_your_person");
});

test("technology context mismatch is treated as a gap rather than direct proof", () => {
  const contextEvidence: EvidenceChunk[] = [
    {
      id: "ctx-1",
      sourceType: "ai_context",
      title: "Enterprise product delivery across AI programs.",
      section: "project-situation",
      text: "Sales and support teams had thousands of documents distributed across Salesforce and SharePoint.",
      tags: ["salesforce", "integration", "product"],
      embedding: [1, 0, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager
    Must have hands-on experience building Salesforce extensions for enterprise workflows.`,
    extractRoleRequirements(`Senior Product Manager
    Must have hands-on experience building Salesforce extensions for enterprise workflows.`),
    contextEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.notEqual(result.presentation.overallMatch.verdict, "strong_fit_lets_talk");
  assert.ok((result.presentation.gapsToNote?.length ?? 0) > 0 || result.presentation.overallMatch.verdict === "probably_not_your_person");
});

test("bad-fit bullets explain specific missing qualifications", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Android Engineer
    5+ years of Android application development.
    Certification XYZ and clearance level 4 required.
    Own Kotlin application architecture and release delivery.`,
    extractRoleRequirements(`Senior Android Engineer
    5+ years of Android application development.
    Certification XYZ and clearance level 4 required.
    Own Kotlin application architecture and release delivery.`),
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  assert.ok((result.presentation.whereIDontFit?.length ?? 0) >= 3);
  const visibleGaps = (result.presentation.whereIDontFit ?? []).map((item) => item.gap).join(" ");
  assert.match(visibleGaps, /enterprise software and SaaS|mobile development experience/i);
  assert.match(visibleGaps, /required certification or clearance/i);
});

test("negative-fit duplicate explanations collapse to Same as above", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior DevOps Engineer
    Own site reliability incident response and on-call operations for production services.
    Drive SRE practice improvements and operational readiness for backend systems.
    Lead postmortem follow-through across infrastructure incidents.`,
    extractRoleRequirements(`Senior DevOps Engineer
    Own site reliability incident response and on-call operations for production services.
    Drive SRE practice improvements and operational readiness for backend systems.
    Lead postmortem follow-through across infrastructure incidents.`),
    evidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  const gaps = result.presentation.whereIDontFit ?? [];
  assert.ok(gaps.length >= 3);
  assert.ok(gaps.slice(1).some((item) => item.gap === "Same as above."));
});

test("invalid LLM no-fit bullets fall back to requirement-consistent gaps", () => {
  const awsRequirements = extractRoleRequirements(`Senior Platform Engineer
    4+ years of AWS cloud experience with computing and networking and security (ECS, IAM, API gateway, VPC, secrets manager).
    6+ years of Python backend engineering experience with AsyncIO, Pydantic, and REST API development.
    Certification XYZ and clearance level 4 required.`);

  const result = assembleFitAnalysisResult({
    input: {
      presentation: {
        mode: "recruiter_brief",
        overallMatch: {
          verdict: "probably_not_your_person",
          label: "Honest Assessment - Probably Not Your Person"
        },
        whereIDontFit: [
          {
            requirement: "4+ years of AWS cloud experience with computing and networking and security (ECS, IAM, API gateway, VPC, secrets manager).",
            gap: "I do not have the required certification or clearance."
          },
          {
            requirement: "6+ years of Python backend engineering experience with AsyncIO, Pydantic, and REST API development.",
            gap: "My background is in product management rather than hands-on execution in this role family."
          }
        ],
        whatDoesTransfer: [
          {
            skillOrExperience: "Senior Product Manager at EPAM",
            relevance: "At EPAM, I led AI evaluation and developer experience initiatives."
          }
        ],
        recommendation: "Use the interview to validate the missing requirements."
      }
    },
    requirements: awsRequirements,
    evidence,
    inputKind: "text",
    presentationMode: "recruiter_brief",
    evaluatorVersion: "test"
  });

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  const awsBullet = (result.presentation.whereIDontFit ?? []).find((item) => /aws|ecs|iam|api gateway|vpc|secrets manager/i.test(item.requirement));
  assert.ok(awsBullet);
  assert.doesNotMatch(awsBullet?.gap ?? "", /certification or clearance/i);
  assert.match(awsBullet?.gap ?? "", /aws|ecs|iam|api gateway|vpc|secrets manager/i);
});

test("AI-context evidence uses explicit parent company metadata in visible output", () => {
  const aiContextEvidence: EvidenceChunk[] = [
    {
      id: "ai-context-1",
      sourceType: "ai_context",
      title: "Enterprise product delivery across AI programs. · AI Experience",
      section: "project-work",
      text: "Led development of a conversational product knowledge assistant MVP and defined the AI evaluation framework.",
      tags: ["ai", "product"],
      metadata: {
        relatedRoleId: "epam",
        company: "EPAM",
        roleTitle: "Senior Product Manager",
        startDate: "2023-06",
        endDate: "2025-01"
      },
      embedding: [1, 0, 0]
    }
  ];

  const result = assembleFitAnalysisResult({
    input: {
      internal: {
        overallSummary: "Strong fit.",
        overallScore: 8,
        dimensions: [
          { name: "core_match", score: 5, rationale: "Direct match.", evidence: [] },
          { name: "execution_scope", score: 4, rationale: "Direct match.", evidence: [] },
          { name: "leadership_collaboration", score: 4, rationale: "Direct match.", evidence: [] },
          { name: "context_readiness", score: 4, rationale: "Direct match.", evidence: [] }
        ],
        strengths: [],
        gaps: [],
        transferableAdvantages: [],
        interviewAngles: []
      }
    },
    requirements: extractRoleRequirements(`Senior Product Manager, AI
    Must have product leadership for conversational AI products and evaluation frameworks.`),
    evidence: aiContextEvidence,
    inputKind: "text",
    presentationMode: "recruiter_brief",
    evaluatorVersion: "test"
  });

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.match(result.presentation.whereIMatch?.[0]?.support ?? "", /^At EPAM, I /);
  const transferText = result.presentation.overallMatch.verdict === "probably_not_your_person"
    ? result.presentation.whatDoesTransfer?.[0]?.skillOrExperience ?? ""
    : "";
  assert.doesNotMatch(transferText, /Enterprise product delivery across AI programs/i);
});

test("portfolio-summary evidence is rewritten into concrete project examples", () => {
  const portfolioEvidence: EvidenceChunk[] = [
    {
      id: "ai-context-summary",
      sourceType: "ai_context",
      title: "Enterprise product delivery across AI programs. · AI Experience",
      section: "summary",
      text: "Portfolio of anonymized EPAM engagements focused on measurable business outcomes and execution in complex enterprise environments.",
      tags: ["ai", "product"],
      metadata: {
        company: "EPAM",
        roleTitle: "Senior Product Manager",
        startDate: "2023-06",
        endDate: "2025-01"
      },
      embedding: [1, 0, 0]
    },
    {
      id: "ai-context-work-1",
      sourceType: "ai_context",
      title: "Enterprise product delivery across AI programs. · AI Experience",
      section: "project-work",
      text: "Led development of a conversational product knowledge assistant MVP and defined the AI evaluation framework.",
      tags: ["ai", "product"],
      metadata: {
        company: "EPAM",
        roleTitle: "Senior Product Manager",
        startDate: "2023-06",
        endDate: "2025-01"
      },
      embedding: [0, 1, 0]
    },
    {
      id: "ai-context-work-2",
      sourceType: "ai_context",
      title: "Enterprise product delivery across AI programs. · Healthcare and MedTech",
      section: "project-work",
      text: "Led portal product work, journey and workflow shaping, integration coordination, and cross-functional governance for a fleet management portal.",
      tags: ["healthcare", "product"],
      metadata: {
        company: "EPAM",
        roleTitle: "Senior Product Manager",
        startDate: "2023-06",
        endDate: "2025-01"
      },
      embedding: [0, 0, 1]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `6+ years of product management experience with a proven track record in data integration and enterprise systems.`,
    extractRoleRequirements(`6+ years of product management experience with a proven track record in data integration and enterprise systems.`),
    portfolioEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const support = result.presentation.whereIMatch?.[0]?.support ?? "";
  assert.match(support, /conversational AI assistant|fleet management portal/i);
  assert.doesNotMatch(support, /anonymized EPAM engagements/i);
});

test("transfer bullets use transferable capabilities rather than role titles", () => {
  const transferEvidence: EvidenceChunk[] = [
    {
      id: "transfer-1",
      sourceType: "resume",
      title: "Product Manager at PwC + Google for Work Innovation Lab",
      section: "achievement-1",
      text: "Led workflow redesign and cloud migration planning, coordinating six external vendors and offshore delivery teams.",
      tags: ["execution", "leadership", "cloud"],
      metadata: {
        company: "PwC + Google for Work Innovation Lab",
        roleTitle: "Product Manager"
      },
      embedding: [1, 0, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Platform Engineer
    6+ years of Python backend engineering experience.
    Own SRE operations and incident response.
    Build AWS infrastructure and service reliability.`,
    extractRoleRequirements(`Senior Platform Engineer
    6+ years of Python backend engineering experience.
    Own SRE operations and incident response.
    Build AWS infrastructure and service reliability.`),
    transferEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  const title = result.presentation.whatDoesTransfer?.[0]?.skillOrExperience ?? "";
  assert.doesNotMatch(title, /Product Manager at PwC/i);
  assert.match(title, /workflow|cloud|coordination|delivery/i);
});

test("transfer evidence does not use AI-context headline as employer fallback", () => {
  const aiContextWithoutCompany: EvidenceChunk[] = [
    {
      id: "transfer-ai-1",
      sourceType: "ai_context",
      title: "Agentic Delivery Framework",
      section: "project-work",
      text: "Separated delivery into product, content, AI architecture, application, QA, and ops roles.",
      tags: ["ai", "execution"],
      embedding: [1, 0, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Platform Engineer
    6+ years of Python backend engineering experience.
    Own SRE operations and incident response.
    Build AWS infrastructure and service reliability.`,
    extractRoleRequirements(`Senior Platform Engineer
    6+ years of Python backend engineering experience.
    Own SRE operations and incident response.
    Build AWS infrastructure and service reliability.`),
    aiContextWithoutCompany,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  assert.equal(result.presentation.overallMatch.verdict, "probably_not_your_person");
  const relevance = result.presentation.whatDoesTransfer?.[0]?.relevance ?? "";
  assert.match(relevance, /^In a prior role, I /);
  assert.doesNotMatch(relevance, /^At Agentic Delivery Framework/i);
});

test("fit-analysis retrieval excludes project and non-experience repo content from recruiter evidence", async () => {
  const { staticRetrievalStore } = await import("@/lib/retrieval/store");
  const evidence = await staticRetrievalStore.searchEvidence("paste upload URL job-description intake", "fit_analysis");

  assert.ok(evidence.length > 0);
  assert.equal(
    evidence.some((item) =>
      item.sourceType === "project" ||
      item.sourceType === "build_doc" ||
      item.sourceType === "case_study" ||
      item.sourceType === "faq"
    ),
    false
  );
});

test("fallback no-fit brief uses role-derived gaps instead of canned transfer bullets", () => {
  const result = assembleFitAnalysisResult({
    input: {
      internal: {
        overallSummary: "Weak fit.",
        overallScore: 3,
        dimensions: [
          { name: "core_match", score: 2, rationale: "Low direct match.", evidence: [] },
          { name: "execution_scope", score: 3, rationale: "Some execution evidence.", evidence: [] },
          { name: "leadership_collaboration", score: 3, rationale: "Some leadership evidence.", evidence: [] },
          { name: "context_readiness", score: 2, rationale: "Low context readiness.", evidence: [] }
        ],
        strengths: [],
        gaps: [],
        transferableAdvantages: [],
        interviewAngles: []
      }
    },
    requirements: extractRoleRequirements(`
      Must have hands-on automotive planning experience.
      Must have direct autonomous driving product ownership.
      Lead cross-functional roadmap execution.
    `),
    evidence,
    inputKind: "text",
    presentationMode: "recruiter_brief",
    evaluatorVersion: "v5-fallback-fit-analysis"
  });

  assert.equal(result.presentation.mode, "recruiter_brief");
  if (result.presentation.overallMatch.verdict !== "probably_not_your_person") {
    assert.fail("Expected a negative recruiter brief.");
  }

  assert.ok((result.presentation.whereIDontFit?.[0]?.requirement ?? "").length > 0);
  assert.doesNotMatch(result.presentation.whatDoesTransfer?.[0]?.skillOrExperience ?? "", /Product strategy and execution under ambiguity|Cross-functional leadership/i);
});

test("scorecard mode remains available for A\/B testing", () => {
  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager\nOwn roadmap, customer discovery, and cross-functional delivery for a SaaS platform.`,
    requirements,
    evidence,
    "text",
    "scorecard"
  );

  assert.equal(result.presentation.mode, "scorecard");
  assert.equal(result.presentation.dimensions[0]?.name, "core_match");
});

test("url role inputs use fetched content while preserving url metadata", async () => {
  const { heuristicFitAnalysisService } = await import("@/lib/ai/fit-analysis");

  const result = await heuristicFitAnalysisService.analyze(
    {
      kind: "url",
      url: "https://example.com/jobs/123",
      content: `Senior Product Manager
Own product roadmap strategy.
Lead stakeholder alignment and delivery execution.`
    },
    "test-session",
    "recruiter_brief"
  );

  assert.equal(result.metadata?.inputKind, "url");
  assert.doesNotMatch(JSON.stringify(result.presentation), /https:\/\/example\.com\/jobs\/123/i);
});

test("fit analysis selects the strongest 3 to 5 senior-signal bullets from a broader candidate set", () => {
  const richEvidence: EvidenceChunk[] = [
    {
      id: "senior-1",
      sourceType: "resume",
      title: "Senior Product Manager at EPAM",
      section: "achievement-1",
      text: "Led portfolio roadmap strategy, stakeholder alignment, and measurable delivery outcomes across complex enterprise initiatives.",
      tags: ["strategy", "roadmap", "stakeholder", "delivery"],
      metadata: { company: "EPAM", roleTitle: "Senior Product Manager", startDate: "2021-06", endDate: "2025-01" },
      embedding: [1, 0, 0]
    },
    {
      id: "senior-2",
      sourceType: "resume",
      title: "Manager, Product Development at Acision (acquired Soli)",
      section: "achievement-1",
      text: "Built team and process foundations, introduced agile practices, and led delivery execution across telecom products.",
      tags: ["team building", "agile", "process", "delivery"],
      metadata: { company: "Acision (acquired Soli)", roleTitle: "Manager, Product Development", startDate: "2011-01", endDate: "2013-01" },
      embedding: [0, 1, 0]
    },
    {
      id: "senior-3",
      sourceType: "resume",
      title: "Product Manager at PwC + Google for Work Innovation Lab",
      section: "achievement-1",
      text: "Owned discovery, requirements, rollout planning, and vendor coordination across a field-service transformation program.",
      tags: ["discovery", "requirements", "rollout", "coordination"],
      metadata: { company: "PwC + Google for Work Innovation Lab", roleTitle: "Product Manager", startDate: "2016-06", endDate: "2017-05" },
      embedding: [0, 0, 1]
    },
    {
      id: "generic-1",
      sourceType: "resume",
      title: "Product Manager at Vingis",
      section: "summary",
      text: "Fractional product leadership across discovery, roadmapping, and execution alignment.",
      tags: ["consulting", "product"],
      metadata: { company: "Vingis", roleTitle: "Product Manager", startDate: "2016-01", endDate: "2020-12" },
      embedding: [1, 1, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Senior Product Manager
Own end-to-end product strategy and roadmap.
Lead cross-functional stakeholder alignment.
Lead, mentor, and develop a small product team while establishing scalable product processes and operating rhythms.
Drive discovery, requirements, and delivery execution with engineering.
Improve operational efficiency and customer experience.
Contribute to a positive and collaborative work environment.`,
    extractRoleRequirements(`Senior Product Manager
Own end-to-end product strategy and roadmap.
Lead cross-functional stakeholder alignment.
Lead, mentor, and develop a small product team while establishing scalable product processes and operating rhythms.
Drive discovery, requirements, and delivery execution with engineering.
Improve operational efficiency and customer experience.
Contribute to a positive and collaborative work environment.`),
    richEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const bullets = result.presentation.whereIMatch ?? [];
  assert.ok(bullets.length >= 3 && bullets.length <= 5);
  assert.equal(bullets.some((item) => /positive and collaborative work environment/i.test(item.requirement)), false);
  assert.equal(
    bullets.some((item) => /lead, mentor, and develop a small product team|operating rhythms/i.test((item.relatedRequirements ?? [item.requirement]).join(" "))),
    true
  );
});

test("culture and work-environment lines are not promoted as recruiter-facing requirements", () => {
  const requirements = extractRoleRequirements(`
    A positive and collaborative work environment with a focus on innovation and sustainability.
    Serve as the Product Manager/Product Owner for the SaaS business.
    Lead discovery, write requirements, and drive delivery with engineering.
  `);

  assert.equal(
    requirements.some((item) => /positive and collaborative work environment|innovation and sustainability/i.test(item.text)),
    false
  );
  assert.equal(
    requirements.some((item) => /serve as the product manager|drive delivery with engineering/i.test(item.text)),
    true
  );
});

test("player-coach requirements prefer leadership and process evidence over isolated technical workflows", () => {
  const leadershipEvidence: EvidenceChunk[] = [
    {
      id: "leader-1",
      sourceType: "resume",
      title: "Manager, Product Development at Acision (acquired Soli)",
      section: "achievement-1",
      text: "Built US technical delivery capacity, introduced agile practices, and established team and process foundations for delivery at scale.",
      tags: ["leadership", "team building", "agile", "process"],
      metadata: { company: "Acision (acquired Soli)", roleTitle: "Manager, Product Development", startDate: "2011-01", endDate: "2013-01" },
      embedding: [1, 0, 0]
    },
    {
      id: "tech-1",
      sourceType: "ai_context",
      title: "Cardstack",
      section: "project-work",
      text: "Built a two-layer KYC workflow integrating with an external provider via API.",
      tags: ["workflow", "api", "kyc"],
      metadata: { company: "Cardstack", roleTitle: "Product Manager", startDate: "2018-03", endDate: "2020-04" },
      embedding: [0, 1, 0]
    }
  ];

  const result = buildFallbackFitAnalysisResponse(
    `Balance strategic leadership with hands-on execution—shipping product while building a high-performing product function.
     Operate effectively in a player-coach capacity—comfortable zooming between strategy and execution.`,
    extractRoleRequirements(`Balance strategic leadership with hands-on execution—shipping product while building a high-performing product function.
     Operate effectively in a player-coach capacity—comfortable zooming between strategy and execution.`),
    leadershipEvidence,
    "text",
    "recruiter_brief"
  );

  assert.equal(result.presentation.mode, "recruiter_brief");
  const support = result.presentation.whereIMatch?.[0]?.support ?? "";
  assert.match(support, /Acision \(acquired Soli\)/);
  assert.doesNotMatch(support, /KYC workflow/i);
});
