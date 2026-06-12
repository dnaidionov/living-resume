import type { ExtractedRoleRequirement } from "@/types/ai";

const credentialKnowledgeSignal =
  /\b(certification|certified|credential|accreditation|exam|working knowledge|knowledge of|knowledgeable about|familiarity with|understanding of|proficiency with|expertise in)\b/i;
const explicitDeliveryPhrase =
  /\b(hands-on|production implementations?|implementation experience|delivery ownership)\b/i;
const nominalDeliveryPhrase =
  /\b(?:ownership|leadership|responsibility)\s+(?:of|for)\b/i;
const responsibleDeliveryPhrase =
  /\bresponsible\s+for\b/i;
const experienceDeliveryPhrase =
  /\bexperience\s+(?:(?:in|with)\s+)?(?:\w+[\s-]+){0,3}(leading|building|implementing|developing|delivering|deploying|owning|operating)\b/i;
const deliveryAction =
  /\b(lead|leading|led|implemented|implementing|built|building|developed|developing|delivered|delivering|deployed|deploying|owned|owning|operated|operating|designed|designing|integrated|integrating|shipped|shipping|managed|managing|architected|architecting|created|creating|launched|launching|scaled|scaling|maintained|maintaining|configured|configuring|oversaw|overseen|overseeing|executed|executing|drove|driving|ran|running)\b/i;
const toIntroducedDeliveryAction =
  /\b(?:ability|capability|responsibility|required|responsible)\s+to\s+(?:\w+ly\s+){0,2}(build|implement|develop|deliver|deploy|own|operate|design|integrate|ship|manage|architect|create|launch|scale|maintain|configure|oversee|execute|drive|run)\b/i;
const modalDeliveryAction =
  /\b(?:must|will|(?:you|the\s+\w+|teams?|candidates?)\s+will)\s+(?:\w+ly\s+){0,2}(build|implement|develop|deliver|deploy|own|operate|design|integrate|ship|manage|architect|create|launch|scale|maintain|configure|oversee|execute|drive|run)\b/i;
const contextualBaseDeliveryAction =
  /(?:^|[;,:]\s*|\s(?:and|then|plus|as\s+well\s+as|while|whereas)\s+|\s[-/]\s+|\b(?:ability|capability|responsibility)\s+to\s+)(?:\w+ly\s+){0,2}(build|implement|develop|deliver|deploy|own|operate|design|integrate|ship|manage|architect|create|launch|scale|maintain|configure|oversee|execute|drive|run)\b/i;
const coordinatedKnowledgeDomain =
  /\b(?:and|plus|as\s+well\s+as)\s+(?:build|deploy)\s+(?:systems?|tooling|tools?|pipelines?|process(?:es)?|infrastructure|architecture)\b/gi;

export function hasCredentialKnowledgeSignal(text: string): boolean {
  return credentialKnowledgeSignal.test(text);
}

export function hasDeliverySignal(text: string): boolean {
  const contextualText = hasCredentialKnowledgeSignal(text)
    ? text.replace(coordinatedKnowledgeDomain, " and knowledge-domain tooling")
    : text;
  const hasContextualBaseAction = contextualBaseDeliveryAction.test(contextualText);

  return explicitDeliveryPhrase.test(text) ||
    nominalDeliveryPhrase.test(text) ||
    responsibleDeliveryPhrase.test(text) ||
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
    /,?\s+(?:while|whereas)\s+/gi,
    /\s+[-/]\s+/g,
    /[,:]\s+/g,
    /\s+(?:and|as\s+well\s+as|plus)\s+(?=(?:(?:\w+ly)\s+){0,2}(?:experience|hands-on|lead|leading|build|implement|deliver|deploy|own|operate|design|integrate|ship|manage|architect|create|launch|scale|maintain|configure|oversee|execute|drive|run|building|implementing|delivering|deploying|owning|operating|designing|integrating|shipping|managing|architecting|creating|launching|scaling|maintaining|configuring|overseeing|executing|driving|running|ability|capability|ownership|leadership|responsibility|responsible|required|must|will|you\s+will|the\s+\w+\s+will)\b)/gi,
    /\s+(?:and|as\s+well\s+as|plus)\s+(?=(?:\w+\s+){1,5}(?:was|were|is|are|be|been)\s+(?:\w+ly\s+){0,2}(?:built|implemented|developed|delivered|deployed|designed|integrated|shipped|managed|architected|created|launched|scaled|maintained|configured|executed)\b)/gi,
    /\s+(?:and|as\s+well\s+as|plus)\s+(?=(?:certification|certified|credential|accreditation|exam|working knowledge|knowledge of|knowledgeable about|familiarity with|understanding of|proficiency with|expertise in)\b)/gi,
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
