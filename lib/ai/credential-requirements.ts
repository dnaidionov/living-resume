import type { ExtractedRoleRequirement } from "@/types/ai";

const credentialKnowledgeSignal =
  /\b(certification|certified|credential|accreditation|exam|working knowledge|knowledge of|familiarity with|understanding of)\b/i;
const deliverySignal =
  /\b(hands-on|implement|implementation|implemented|build|built|develop|developed|deliver|delivery|deploy|deployed|production|lead|leading|led|own|owned|ownership|operate|operated)\b/i;

export function hasCredentialKnowledgeSignal(text: string): boolean {
  return credentialKnowledgeSignal.test(text);
}

export function hasDeliverySignal(text: string): boolean {
  return deliverySignal.test(text);
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

function splitCompoundCredentialRequirementText(text: string): [string, string] | null {
  if (!hasCredentialKnowledgeSignal(text) || !hasDeliverySignal(text)) {
    return null;
  }

  const boundaries = [
    /,\s+with\s+/gi,
    /;\s+/g,
    /,\s+and\s+/gi,
    /\s+and\s+(?=(?:experience|hands-on|lead|leading|build|implement|deliver|deploy|own|operate)\b)/gi
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
        return [left, right];
      }
    }
  }

  return null;
}

function cleanClause(value: string): string {
  return value.trim().replace(/^[,;:\s]+|[,;:\s.]+$/g, "");
}
