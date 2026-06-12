import type { ExtractedRoleRequirement } from "@/types/ai";

const credentialKnowledgeSignal =
  /\b(certification|certified|credential|accreditation|exam|working knowledge|knowledge of|familiarity with|understanding of)\b/i;
const explicitDeliveryPhrase =
  /\b(hands-on|production implementations?|implementation experience|delivery ownership)\b/i;
const experienceDeliveryPhrase =
  /\bexperience\s+(?:(?:in|with)\s+)?(?:\w+[\s-]+){0,3}(leading|building|implementing|developing|delivering|deploying|owning|operating)\b/i;
const deliveryAction =
  /\b(lead|leading|led|implemented|implementing|built|building|developed|developing|delivered|delivering|deployed|deploying|owned|owning|operated|operating)\b/i;
const toIntroducedDeliveryAction =
  /\b(?:ability|capability|responsibility|required|responsible)\s+to\s+(build|implement|develop|deliver|deploy|own|operate)\b/i;
const modalDeliveryAction =
  /\b(?:must|will|you\s+will)\s+(build|implement|develop|deliver|deploy|own|operate)\b/i;
const contextualBaseDeliveryAction =
  /(?:^|[;,:]\s*|\b(?:and|then)\s+|\b(?:ability|capability|responsibility)\s+to\s+)(build|implement|develop|deliver|deploy|own|operate)\b/i;
const coordinatedKnowledgeDomain =
  /\band\s+(?:build|deploy)\s+(?:systems?|tooling|tools?|pipelines?|process(?:es)?|infrastructure|architecture)\b/gi;

export function hasCredentialKnowledgeSignal(text: string): boolean {
  return credentialKnowledgeSignal.test(text);
}

export function hasDeliverySignal(text: string): boolean {
  const contextualText = hasCredentialKnowledgeSignal(text)
    ? text.replace(coordinatedKnowledgeDomain, " and knowledge-domain tooling")
    : text;
  const hasContextualBaseAction = contextualBaseDeliveryAction.test(contextualText);

  return explicitDeliveryPhrase.test(text) ||
    experienceDeliveryPhrase.test(text) ||
    deliveryAction.test(text) ||
    toIntroducedDeliveryAction.test(text) ||
    modalDeliveryAction.test(text) ||
    hasContextualBaseAction;
}

export function isCredentialOnlyRequirement(text: string): boolean {
  return hasCredentialKnowledgeSignal(text) && !hasDeliverySignal(text);
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
      category: hasDeliverySignal(text) ? "function" as const : "requirement" as const
    }));
  });
}

function splitCompoundCredentialRequirementText(text: string): string[] | null {
  if (!hasCredentialKnowledgeSignal(text) || !hasDeliverySignal(text)) {
    return null;
  }

  const boundaries = [
    /,\s+with\s+/gi,
    /;\s+/g,
    /,\s+(?:and|plus)\s+/gi,
    /\s+(?:and|as\s+well\s+as)\s+(?=(?:experience|hands-on|lead|leading|build|implement|deliver|deploy|own|operate|responsible|required|must|will|you\s+will)\b)/gi,
    /\s+(?:and|as\s+well\s+as)\s+(?=(?:certification|certified|credential|accreditation|exam|working knowledge|knowledge of|familiarity with|understanding of)\b)/gi,
    /\s+with\s+(?=(?:ability|capability|responsibility|responsible|required)\s+to\b)/gi
  ];

  for (const boundary of boundaries) {
    for (const match of text.matchAll(boundary)) {
      const index = match.index;
      if (index === undefined) {
        continue;
      }
      const left = cleanClause(text.slice(0, index));
      const right = cleanClause(text.slice(index + match[0].length));
      if (
        left.length >= 12 &&
        right.length >= 12 &&
        (
          (hasCredentialKnowledgeSignal(left) && hasDeliverySignal(right)) ||
          (hasDeliverySignal(left) && hasCredentialKnowledgeSignal(right))
        )
      ) {
        return [
          ...(splitCompoundCredentialRequirementText(left) ?? [left]),
          ...(splitCompoundCredentialRequirementText(right) ?? [right])
        ];
      }
    }
  }

  return null;
}

function cleanClause(value: string): string {
  return value.trim().replace(/^[,;:\s]+|[,;:\s.]+$/g, "");
}
