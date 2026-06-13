import type { ExtractedRoleRequirement } from "@/types/ai";

type ClauseKind = "knowledge" | "delivery" | "ambiguous";

type ClauseAnalysis = {
  kind: ClauseKind;
  hasKnowledge: boolean;
  hasDelivery: boolean;
};

type Boundary = {
  start: number;
  end: number;
};

const knowledgeSignal =
  /\b(certification|certified|credential|accreditation|exam|working knowledge|knowledge of|knowledgeable about|familiarity with|understanding of|proficiency (?:with|in)|proficient (?:with|in)|expertise in)\b/i;

const deliveryVerb =
  "(?:lead|implement|develop|deliver|deploy|own|operate|design|integrate|ship|manage|architect|create|launch|scale|maintain|configure|oversee|execute|drive|run|build|optimize|monitor|troubleshoot|test)";
const deliveryVerbForms =
  "(?:lead|leading|led|implement(?:ed|ing)?|develop(?:ed|ing)?|deliver(?:ed|ing)?|deploy(?:ed|ing)?|own(?:ed|ing)?|operate|operated|operating|design(?:ed|ing)?|integrate|integrated|integrating|ship|shipped|shipping|manage|managed|managing|architect(?:ed|ing)?|create|created|creating|launch(?:ed|ing)?|scale|scaled|scaling|maintain(?:ed|ing)?|configure|configured|configuring|oversee|oversaw|overseen|overseeing|execute|executed|executing|drive|drove|driving|run|ran|running|build|built|building|optimize|optimized|optimizing|monitor(?:ed|ing)?|troubleshoot(?:ed|ing)?|test(?:ed|ing)?)";
const actor =
  "(?:(?:(?:the|a|an)\\s+)?(?:(?:successful|ideal|selected|qualified|chosen|new|prospective)\\s+){0,2}(?:candidates?|applicants?)|(?:the\\s+)?(?:person|employee|hire)(?:\\s+in\\s+this\\s+role)?|(?:the\\s+)?(?:role\\s+holder|incumbent)|(?:the\\s+)?teams?|you|they|he|she|we)";
const obligation =
  `(?:(?:must|will|would|shall|should|can|could|may)|(?:has|have)\\s+to|(?:must\\s+)?be\\s+able\\s+to|(?:(?:is|are)\\s+)?expected\\s+to|needs?\\s+to)`;

const explicitDelivery =
  /\b(hands-on|production implementations?|implementation experience|delivery ownership|responsible for)\b/i;
const experienceDelivery = new RegExp(
  `\\bexperience\\s+(?:(?:in|with)\\s+)?(?:\\w+[\\s-]+){0,3}${deliveryVerbForms}\\b`,
  "i"
);
const introducedDelivery = new RegExp(
  `\\b(?:(?:ability|capability|responsibility|required|responsible)\\s+to|(?:be\\s+)?able\\s+to)\\s+(?:\\w+ly\\s+){0,2}${deliveryVerb}\\b`,
  "i"
);
const deliveryEvidence = new RegExp(
  `\\b(?:track\\s+record\\s+of|demonstrated\\s+success(?:\\s+in)?|\\d+\\+?\\s+years?(?:\\s+of\\s+experience)?(?:\\s+in)?|accountable\\s+for)\\s+(?:\\w+[\\s-]+){0,2}${deliveryVerbForms}\\b`,
  "i"
);
const actorObligation = new RegExp(
  `^(?:(?:you['’](?:ll|d)|you(?:['’]re|\\s+are)?\\s+expected\\s+to|(?:we|(?:the\\s+)?recruiter)\\s+expects?\\s+you\\s+to)|${actor}\\s+${obligation}|${obligation})\\s+(?:\\w+ly\\s+){0,2}${deliveryVerb}\\b`,
  "i"
);
const directDelivery = new RegExp(`^(?:\\w+ly\\s+){0,2}${deliveryVerbForms}\\b`, "i");
const passiveDelivery = new RegExp(
  `^(?:(?!\\b(?:that|which|who)\\b).){1,80}\\b(?:was|were|is|are|be|been)\\s+(?:\\w+ly\\s+){0,2}(?:being\\s+)?(?:\\w+ly\\s+){0,2}(?:built|implemented|developed|delivered|deployed|designed|integrated|shipped|managed|architected|created|launched|scaled|maintained|configured|executed)\\b`,
  "i"
);

const conceptualAccountability =
  /\b(?:ownership|leadership|responsibility)(?:\s+\w+){0,3}\s+(?:models?|principles?|matrices?|frameworks?|concepts?|patterns?)\b/i;
const directAccountability =
  /\b(?:ownership|leadership|responsibility)\s+(?:of|for)\b/i;
const suffixAccountability =
  /\b(?:design\s+systems?|systems?|platforms?|products?|workflows?|integrations?|deployments?|architecture)\s+(?:ownership|leadership|responsibility)\b/i;

const actionShapedKnowledgeDomain =
  /^(?:build|deploy)\s+(?:systems?|tooling|tools?|pipelines?|process(?:es)?|infrastructure|architecture)\b|^design\s+(?:systems?|patterns?|and\s+architecture\s+patterns?)\b|^build-vs-buy\s+tradeoffs?\b|^operating\s+systems?\b|^managed\s+services?\b|^integrated\s+development\s+environments?\b/i;

const boundaryPatterns = [
  /,\s+with\s+/gi,
  /;\s*/g,
  /,\s+(?:and|plus)\s+/gi,
  /,?\s+(?:while|whereas)\s+/gi,
  /\s+(?:and|plus|as\s+well\s+as)\s+/gi,
  /\s+with\s+/gi,
  /\s+[|&-]\s+/g,
  /\s*[—–]\s*/g,
  /\//g,
  /[,:]\s*/g
];

export function hasCredentialKnowledgeSignal(text: string): boolean {
  return knowledgeSignal.test(text);
}

export function hasDeliverySignal(text: string): boolean {
  const split = splitCompoundCredentialRequirementText(text);
  if (split) {
    return split.some((clause) => analyzeClause(clause).hasDelivery);
  }
  return analyzeClause(text).hasDelivery;
}

export function isCredentialOnlyRequirement(text: string): boolean {
  const split = splitCompoundCredentialRequirementText(text);
  if (split) {
    return split.every((clause) => analyzeClause(clause).kind === "knowledge");
  }
  return analyzeClause(text).kind === "knowledge";
}

export function splitCompoundCredentialRequirements(
  requirements: ExtractedRoleRequirement[]
): ExtractedRoleRequirement[] {
  return requirements.flatMap((requirement) => {
    const split = splitCompoundCredentialRequirementText(requirement.text);
    if (!split) {
      return [requirement];
    }

    return split.map((text) => ({
      ...requirement,
      text,
      category: analyzeClause(text).hasDelivery ? "function" as const : "requirement" as const
    }));
  });
}

function splitCompoundCredentialRequirementText(text: string): string[] | null {
  if (!hasCredentialKnowledgeSignal(text)) {
    return null;
  }

  const candidates = collectBoundaries(text)
    .map((boundary) => buildSplitCandidate(text, boundary))
    .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
    .sort((left, right) => right.score - left.score);

  const best = candidates[0];
  if (!best) {
    return null;
  }

  return [
    ...(splitCompoundCredentialRequirementText(best.left) ?? [best.left]),
    ...(splitCompoundCredentialRequirementText(best.right) ?? [best.right])
  ];
}

function buildSplitCandidate(text: string, boundary: Boundary) {
  const left = cleanClause(text.slice(0, boundary.start));
  const right = cleanClause(text.slice(boundary.end));
  if (left.length < 3 || right.length < 3) {
    return null;
  }

  const leftAnalysis = analyzeClause(left);
  const rightAnalysis = analyzeClause(right);
  const forward = leftAnalysis.kind === "knowledge" && rightAnalysis.hasDelivery;
  const reverse = leftAnalysis.hasDelivery && rightAnalysis.kind === "knowledge";
  if (!forward && !reverse) {
    return null;
  }

  // Keep the framed side intact: knowledge precedes delivery in forward
  // compounds, while delivery precedes knowledge in reverse compounds.
  const framedLength = left.length;
  const boundaryLength = boundary.end - boundary.start;
  return {
    left,
    right,
    score: framedLength * 1000 + boundaryLength
  };
}

function collectBoundaries(text: string): Boundary[] {
  const unique = new Map<string, Boundary>();
  for (const pattern of boundaryPatterns) {
    for (const match of text.matchAll(pattern)) {
      if (match.index === undefined || match[0].length === 0) {
        continue;
      }
      const boundary = {
        start: match.index,
        end: match.index + match[0].length
      };
      unique.set(`${boundary.start}:${boundary.end}`, boundary);
    }
  }
  return [...unique.values()];
}

function analyzeClause(text: string): ClauseAnalysis {
  const normalized = normalizeClause(text);
  const hasKnowledge = hasCredentialKnowledgeSignal(normalized);
  const hasDelivery = isDeliveryClause(normalized, hasKnowledge);
  return {
    kind: hasKnowledge && !hasDelivery
      ? "knowledge"
      : hasDelivery
        ? "delivery"
        : "ambiguous",
    hasKnowledge,
    hasDelivery
  };
}

function isDeliveryClause(text: string, hasKnowledge: boolean): boolean {
  if (
    explicitDelivery.test(text) ||
    experienceDelivery.test(text) ||
    introducedDelivery.test(text) ||
    deliveryEvidence.test(text)
  ) {
    return true;
  }
  if (hasPersonalAccountability(text)) {
    return true;
  }

  if (hasKnowledge) {
    return actorObligation.test(text) ||
      directDelivery.test(text) ||
      hasEmbeddedDelivery(text);
  }
  if (actionShapedKnowledgeDomain.test(text)) {
    return false;
  }

  return actorObligation.test(text) ||
    directDelivery.test(text) ||
    passiveDelivery.test(text);
}

function hasPersonalAccountability(text: string): boolean {
  if (directAccountability.test(text)) {
    return true;
  }
  if (conceptualAccountability.test(text)) {
    return false;
  }
  return suffixAccountability.test(text);
}

function hasEmbeddedDelivery(text: string): boolean {
  return collectBoundaries(text).some((boundary) => {
    const suffix = normalizeClause(text.slice(boundary.end));
    if (!suffix) {
      return false;
    }
    return isDeliveryClause(suffix, false);
  });
}

function normalizeClause(text: string): string {
  return cleanClause(text)
    .replace(/\s+/g, " ")
    .trim();
}

function cleanClause(value: string): string {
  return value.trim().replace(/^[,;:\s]+|[,;:\s.]+$/g, "");
}
