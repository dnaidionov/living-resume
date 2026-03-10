export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LivingResumeBot/0.2",
      accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job description from ${url}`);
  }

  const html = await response.text();
  const normalized = extractReadableText(html);

  if (normalized.length < 200) {
    throw new Error("Fetched page did not contain enough readable job description content.");
  }

  return normalized;
}

export function extractReadableText(html: string): string {
  const primaryHtml = extractPrimaryHtml(html);
  const text = htmlToReadableText(primaryHtml);
  const sections = text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !isBoilerplateSegment(item));

  const ranked = sections
    .map((section) => ({
      section,
      score: scoreSegment(section)
    }))
    .filter((item) => item.score > 0);

  const selectedSections = (ranked.length > 0 ? ranked.map((item) => item.section) : sections).slice(0, 40);

  return selectedSections
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ *\n */g, "\n")
    .trim();
}

function extractPrimaryHtml(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(nav|header|footer|form|aside|dialog)[^>]*>[\s\S]*?<\/\1>/gi, " ");

  const primaryMatch = stripped.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);
  if (primaryMatch?.[0]) {
    return primaryMatch[0];
  }

  const bodyMatch = stripped.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? stripped;
}

function htmlToReadableText(html: string): string {
  return html
    .replace(/<(section|div|ul|ol|main|article)[^>]*>/gi, "\n")
    .replace(/<\/(section|div|ul|ol|main|article)>/gi, "\n")
    .replace(/<(h1|h2|h3|h4|h5|h6)[^>]*>/gi, "\n")
    .replace(/<\/(h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function isBoilerplateSegment(segment: string): boolean {
  return /(privacy|cookies|sign in|sign-in|apply now|job alert|share this job|equal opportunity|accommodation|benefits|terms of use|page source|javascript required|skip to content|submit application)/i.test(segment);
}

function scoreSegment(segment: string): number {
  let score = 0;

  if (segment.length <= 90 && !isBoilerplateSegment(segment)) {
    score += 1;
  }
  if (/(responsibilities|qualifications|requirements|you will|about the role|preferred qualifications|what you'?ll do|what you will do)/i.test(segment)) {
    score += 3;
  }
  if (/(experience|ability|develop|drive|lead|build|deliver|determine|define|gather|analy|align|strategy|road-?map|requirements|mission|goal|bring|technical|work cross-functionally|partner)/i.test(segment)) {
    score += 2;
  }
  if (/^- /.test(segment) || /\n- /.test(segment)) {
    score += 1;
  }
  if (segment.length > 400) {
    score -= 1;
  }

  return score;
}
