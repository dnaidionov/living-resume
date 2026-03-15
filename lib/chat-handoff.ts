export type FitCheckTarget =
  | { kind: "url"; value: string }
  | { kind: "text"; value: string };

const urlPattern = /https?:\/\/[^\s]+/i;
const fitIntentPattern =
  /\b(fit check|fit analysis|resume fit|role fit|good fit|analy[sz]e (this )?(job|role|jd)|run (the )?(fit|resume fit|role fit)|check (my|the) fit|match (me|my resume)|is .+ a good fit for (this )?(job|role)|how well does .+ fit)\b/i;

export function extractFitCheckTarget(message: string): FitCheckTarget | null {
  const trimmed = message.trim();
  if (!fitIntentPattern.test(trimmed)) {
    return null;
  }

  const urlMatch = trimmed.match(urlPattern);
  if (urlMatch?.[0]) {
    return { kind: "url", value: urlMatch[0] };
  }

  const normalized = trimmed.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length > 1) {
    const [first, ...rest] = lines;
    if (fitIntentPattern.test(first) && rest.length > 0) {
      return { kind: "text", value: rest.join("\n") };
    }

    return { kind: "text", value: lines.join("\n") };
  }

  const colonIndex = normalized.indexOf(":");
  if (colonIndex >= 0) {
    const afterColon = normalized.slice(colonIndex + 1).trim();
    if (afterColon.length >= 80) {
      return { kind: "text", value: afterColon };
    }
  }

  return null;
}

export function isAffirmativeFitHandoffReply(message: string): boolean {
  const normalized = message.trim().toLowerCase().replace(/[.!?]/g, "");
  return /^(yes|yep|yeah|sure|ok|okay|do it|go ahead|please do|take me there|open it|sure, do it)$/i.test(normalized);
}

export function isNegativeFitHandoffReply(message: string): boolean {
  const normalized = message.trim().toLowerCase().replace(/[.!?]/g, "");
  return /^(no|nope|not now|stay here|keep chatting|continue here)$/i.test(normalized);
}
