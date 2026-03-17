import type { FitTargetSummary } from "@/types/ai";

export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  const result = await fetchJobPostingFromUrl(url);
  return result.content;
}

export async function fetchJobPostingFromUrl(url: string): Promise<{ content: string; targetSummary?: FitTargetSummary }> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job description from ${url}`);
  }

  const html = await response.text();
  const normalized = extractReadableText(html);
  const targetSummary = extractJobTargetSummary(html, url);

  if (normalized.length < 60 && scoreDocument(normalized) < 3) {
    if (/enable javascript to run this app|javascript required|please enable javascript/i.test(html)) {
      throw new Error("This job page is heavily JavaScript-rendered, and the current fetch could not recover enough recruiter-readable description text. Use Paste Text or Upload File for this posting.");
    }
    throw new Error("Fetched page did not contain enough readable job description content.");
  }

  return {
    content: normalized,
    targetSummary
  };
}

export function extractReadableText(html: string): string {
  const structuredText = extractStructuredJobText(html);
  const primaryHtml = extractPrimaryHtml(html);
  const primaryText = normalizeSegments(htmlToReadableText(primaryHtml)).join("\n\n");
  const metaText = extractMetaFallbackText(html);

  const candidates = [
    { text: structuredText, source: "structured" },
    { text: mergeTextParts(metaText, structuredText), source: "structured_with_meta" },
    { text: primaryText, source: "primary" },
    { text: mergeTextParts(metaText, primaryText), source: "primary_with_meta" },
    { text: metaText, source: "meta" }
  ]
    .map((item) => ({
      ...item,
      text: normalizeSegments(item.text).join("\n\n")
    }))
    .filter((item) => item.text.length > 0)
    .sort((left, right) => scoreCandidate(right) - scoreCandidate(left));

  if (candidates.length === 0) {
    return "";
  }

  const text = candidates[0]?.text ?? "";
  const sections = normalizeSegments(text);

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

function extractMetaFallbackText(html: string): string {
  const values = [
    extractMetaContent(html, "description"),
    extractMetaContent(html, "og:description"),
    extractMetaContent(html, "twitter:description"),
    extractTitle(html)
  ]
    .filter(Boolean)
    .map((item) => normalizeStructuredString(item as string));

  return normalizeSegments(values.join("\n\n")).join("\n\n");
}

function extractMetaTitleCandidates(html: string): string[] {
  return [
    extractMetaContent(html, "og:title"),
    extractMetaContent(html, "twitter:title"),
    extractTitle(html)
  ]
    .filter(Boolean)
    .map((item) => normalizeStructuredString(item as string))
    .filter(Boolean);
}

function extractMetaCompanyCandidates(html: string): string[] {
  return [
    extractMetaContent(html, "og:site_name"),
    extractMetaContent(html, "application-name"),
    extractMetaContent(html, "twitter:site")
  ]
    .filter(Boolean)
    .map((item) => normalizeStructuredString(item as string).replace(/^@/, ""))
    .filter(Boolean);
}

function extractMetaContent(html: string, name: string): string | undefined {
  const pattern = new RegExp(`<meta[^>]+(?:name|property)=["']${escapeRegExp(name)}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i");
  return html.match(pattern)?.[1];
}

function extractTitle(html: string): string | undefined {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
}

function extractStructuredJobText(html: string): string {
  const candidates: string[] = [];

  const providerSpecific = extractProviderSpecificText(html);
  if (providerSpecific.length > 0) {
    candidates.push(providerSpecific);
  }

  for (const script of extractJsonScripts(html)) {
    const parsed = tryParseJson(script);
    if (!parsed) {
      continue;
    }

    const structuredSegments = collectStructuredJobSegments(parsed);
    if (structuredSegments.length > 0) {
      candidates.push(normalizeSegments(structuredSegments.join("\n\n")).join("\n\n"));
    }
  }

  const best = candidates
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .sort((left, right) => scoreDocument(right) - scoreDocument(left))[0];

  return best ?? "";
}

function extractProviderSpecificText(html: string): string {
  const candidates: string[] = [];

  const ashbyDescription = extractJsonEncodedField(html, "descriptionHtml");
  if (ashbyDescription) {
    const ashbyTitle = extractJsonEncodedField(html, "title");
    candidates.push(mergeTextParts(ashbyTitle, normalizeStructuredString(ashbyDescription)));
  }

  const ldJsonPosting = extractJsonLdJobPosting(html);
  if (ldJsonPosting) {
    candidates.push(mergeTextParts(ldJsonPosting.company, ldJsonPosting.title, ldJsonPosting.description));
  }

  return candidates
    .map((item) => item.trim())
    .filter(Boolean)
    .sort((left, right) => scoreDocument(right) - scoreDocument(left))[0] ?? "";
}

function extractProviderSpecificTargetSummary(html: string, fallbackCompany?: string): FitTargetSummary | undefined {
  const ldJsonPosting = extractJsonLdJobPosting(html);
  if (ldJsonPosting?.title) {
    return {
      roleTitle: normalizeTargetPart(ldJsonPosting.title),
      companyName: normalizeTargetPart(ldJsonPosting.company) ?? normalizeTargetPart(fallbackCompany),
      displayLabel: buildDisplayLabel(ldJsonPosting.title, ldJsonPosting.company ?? fallbackCompany)
    };
  }

  const ashbyTitle = extractJsonEncodedField(html, "title");
  const ashbyCompany =
    extractJsonEncodedField(html, "companyName") ??
    extractJsonEncodedField(html, "organizationName") ??
    extractJsonEncodedField(html, "company");

  if (ashbyTitle) {
    return {
      roleTitle: normalizeTargetPart(ashbyTitle),
      companyName: normalizeTargetPart(ashbyCompany) ?? normalizeTargetPart(fallbackCompany),
      displayLabel: buildDisplayLabel(ashbyTitle, ashbyCompany ?? fallbackCompany)
    };
  }

  return undefined;
}

function extractJsonLdJobPosting(html: string): { title?: string; description?: string; company?: string } | undefined {
  const scripts = Array.from(html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))
    .map((match) => match[1]?.trim())
    .filter(Boolean);

  for (const script of scripts) {
    const parsed = tryParseJson(script as string);
    if (!parsed) {
      continue;
    }

    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    for (const node of nodes) {
      if (!node || typeof node !== "object") {
        continue;
      }
      const record = node as Record<string, unknown>;
      if (String(record["@type"] ?? "").toLowerCase() !== "jobposting") {
        continue;
      }
      const description = typeof record.description === "string" ? record.description : undefined;
      const title = typeof record.title === "string" ? record.title : undefined;
      const hiringOrganization = record.hiringOrganization;
      const company =
        hiringOrganization && typeof hiringOrganization === "object"
          ? typeof (hiringOrganization as Record<string, unknown>).name === "string"
            ? ((hiringOrganization as Record<string, unknown>).name as string)
            : undefined
          : undefined;

      if ((description && description.trim()) || (title && title.trim()) || (company && company.trim())) {
        return { title, description, company };
      }
    }
  }

  return undefined;
}

function normalizeTargetPart(value?: string): string | undefined {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

function buildDisplayLabel(title?: string, company?: string): string {
  const roleTitle = normalizeTargetPart(title);
  const companyName = normalizeTargetPart(company);
  return companyName && roleTitle ? `${roleTitle} - ${companyName}` : roleTitle ?? companyName ?? "";
}

function deriveCompanyFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.toLowerCase().split(".").filter(Boolean);
    const meaningfulHost = hostParts.find((part) => !["www", "jobs", "careers", "explore", "job-boards"].includes(part));
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    if (parsed.hostname === "jobs.ashbyhq.com" && pathParts[0]) {
      return humanizeCompanySlug(pathParts[0]);
    }

    if (parsed.hostname === "job-boards.greenhouse.io" && pathParts[0]) {
      return humanizeCompanySlug(pathParts[0]);
    }

    if (meaningfulHost) {
      return humanizeCompanySlug(meaningfulHost);
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function humanizeCompanySlug(value: string): string | undefined {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!cleaned) {
    return undefined;
  }

  const normalized =
    cleaned === "withwaymo"
      ? "waymo"
      : cleaned === "gomotive"
        ? "motive"
        : cleaned;

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function looksLikeRoleTitle(value: string): boolean {
  return value.length <= 120 &&
    !/\b(as the|you will|you'll|responsible for|own strategy|execution across)\b/i.test(value) &&
    /\b(product|manager|director|lead|head|owner|principal|staff|senior|group|vp|vice president)\b/i.test(value);
}

function looksLikeCompany(value: string): boolean {
  return !!value &&
    !looksLikeRoleTitle(value) &&
    !/\b(remote|hybrid|on site|full-time|part-time|mountain view|san francisco|new york|california|united states)\b/i.test(value);
}

function parseTitleAndCompanyCandidate(value: string, urlCompany?: string): { roleTitle?: string; companyName?: string } | undefined {
  const normalized = normalizeStructuredString(value);
  const parts = normalized.split("|").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const roleTitle = parts.find(looksLikeRoleTitle);
    const companyName = [...parts].reverse().find(looksLikeCompany) ?? urlCompany;
    if (roleTitle) {
      return { roleTitle, companyName };
    }
  }

  const dashParts = normalized.split(/\s+-\s+/).map((part) => part.trim()).filter(Boolean);
  if (dashParts.length >= 2 && looksLikeRoleTitle(dashParts[0] ?? "")) {
    const companyName = [...dashParts].reverse().find(looksLikeCompany) ?? urlCompany;
    return {
      roleTitle: dashParts[0],
      companyName
    };
  }

  if (looksLikeRoleTitle(normalized)) {
    return {
      roleTitle: normalized,
      companyName: urlCompany
    };
  }

  return undefined;
}

function extractVisibleBodyRoleTitle(bodyText: string): string | undefined {
  const globalAsRoleMatch = bodyText.match(/\bAs the ([A-Z][A-Za-z0-9/&,\- ]{3,100}?)(?:,|\s+you\b)/);
  const globalCandidate = normalizeTargetPart(globalAsRoleMatch?.[1]);
  if (globalCandidate && looksLikeRoleTitle(globalCandidate)) {
    return globalCandidate;
  }

  const lines = bodyText
    .split("\n")
    .map((line) => normalizeStructuredString(line))
    .filter(Boolean)
    .slice(0, 40);

  for (const line of lines) {
    const asRoleMatch = line.match(/\bAs the ([A-Z][A-Za-z0-9/&,\- ]{3,100}?)(?:,|\s+you\b)/);
    const candidate = normalizeTargetPart(asRoleMatch?.[1]);
    if (candidate && looksLikeRoleTitle(candidate)) {
      return candidate;
    }
  }

  for (const line of lines) {
    if (looksLikeRoleTitle(line)) {
      return line;
    }
  }

  return undefined;
}

function extractReadableRoleTitleOverride(readableText: string): string | undefined {
  const globalAsRoleMatch = readableText.match(/\bAs the ([A-Z][A-Za-z0-9/&,\- ]{3,100}?)(?:,|\s+you\b)/);
  const globalCandidate = normalizeTargetPart(globalAsRoleMatch?.[1]);
  if (globalCandidate && looksLikeRoleTitle(globalCandidate)) {
    return globalCandidate;
  }

  return undefined;
}

export function extractJobTargetSummary(html: string, url: string): FitTargetSummary | undefined {
  const urlCompany = deriveCompanyFromUrl(url);
  const readableText = extractReadableText(html);
  const bodyText = normalizeSegments(htmlToReadableText(extractPrimaryHtml(html))).join("\n");
  const visibleBodyRoleTitle = extractVisibleBodyRoleTitle(bodyText) ?? extractReadableRoleTitleOverride(readableText);
  const structured = extractProviderSpecificTargetSummary(html, urlCompany);
  if (structured?.displayLabel) {
    if (visibleBodyRoleTitle && structured.roleTitle && visibleBodyRoleTitle !== structured.roleTitle) {
      return {
        roleTitle: visibleBodyRoleTitle,
        companyName: structured.companyName,
        displayLabel: buildDisplayLabel(visibleBodyRoleTitle, structured.companyName)
      };
    }
    return structured;
  }

  for (const candidate of extractMetaTitleCandidates(html)) {
    const parsed = parseTitleAndCompanyCandidate(candidate, urlCompany);
    if (parsed?.roleTitle) {
      const roleTitle =
        visibleBodyRoleTitle && visibleBodyRoleTitle !== parsed.roleTitle
          ? visibleBodyRoleTitle
          : parsed.roleTitle;
      return {
        roleTitle,
        companyName: parsed.companyName,
        displayLabel: buildDisplayLabel(roleTitle, parsed.companyName)
      };
    }
  }

  const firstHeading = readableText.split("\n").map((item) => item.trim()).find(Boolean);
  if (firstHeading && looksLikeRoleTitle(firstHeading)) {
    const metaCompany = extractMetaCompanyCandidates(html).find(looksLikeCompany) ?? urlCompany;
    return {
      roleTitle: firstHeading,
      companyName: metaCompany,
      displayLabel: buildDisplayLabel(firstHeading, metaCompany)
    };
  }

  const metaCompany = extractMetaCompanyCandidates(html).find(looksLikeCompany) ?? urlCompany;
  const title = extractTitle(html);
  if (title) {
    const parsed = parseTitleAndCompanyCandidate(title, metaCompany);
    if (parsed?.roleTitle) {
      return {
        roleTitle: parsed.roleTitle,
        companyName: parsed.companyName,
        displayLabel: buildDisplayLabel(parsed.roleTitle, parsed.companyName)
      };
    }
  }

  return undefined;
}

function extractJsonEncodedField(html: string, fieldName: string): string | undefined {
  const pattern = new RegExp(`"${escapeRegExp(fieldName)}":"((?:\\\\.|[^"\\\\])*)"`, "i");
  const match = html.match(pattern)?.[1];
  if (!match) {
    return undefined;
  }

  try {
    return JSON.parse(`"${match}"`) as string;
  } catch {
    return undefined;
  }
}

function extractJsonScripts(html: string): string[] {
  const matches = Array.from(html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi));
  return matches
    .map((match) => match[1]?.trim() ?? "")
    .filter(Boolean)
    .filter((content) => /application\/ld\+json|__NEXT_DATA__|__NUXT__|jobPosting|description|responsibilities|qualifications|lever|ashby|greenhouse|posting/i.test(content));
}

function tryParseJson(content: string): unknown {
  const cleaned = content
    .trim()
    .replace(/^window\.__INITIAL_STATE__\s*=\s*/i, "")
    .replace(/^window\.__NEXT_DATA__\s*=\s*/i, "")
    .replace(/;$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    return undefined;
  }
}

function collectStructuredJobSegments(value: unknown, path = ""): string[] {
  if (typeof value === "string") {
    const normalized = normalizeStructuredString(value);
    return isStructuredJobSegment(normalized, path) ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectStructuredJobSegments(item, `${path}[${index}]`));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const objectValue = value as Record<string, unknown>;
  const keys = Object.keys(objectValue);
  const isJobPostingObject = keys.some((key) => /(description|responsibilities|qualifications|requirements|jobPosting|posting|mission|whatYouWillDo|whatYoullDo|aboutRole)/i.test(key));

  return keys.flatMap((key) => {
    const nextPath = path ? `${path}.${key}` : key;
    const child = objectValue[key];

    if (typeof child === "string") {
      const normalized = normalizeStructuredString(child);
      return isStructuredJobSegment(normalized, nextPath) || (isJobPostingObject && normalized.length >= 40 && !looksLikeConfigBlob(normalized))
        ? [normalized]
        : [];
    }

    return collectStructuredJobSegments(child, nextPath);
  });
}

function normalizeStructuredString(value: string): string {
  return htmlToReadableText(decodeHtmlEntities(value).replace(/\\n/g, "\n"))
    .replace(/\\"/g, "\"")
    .replace(/&#34;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ *\n */g, "\n")
    .trim();
}

function mergeTextParts(...parts: Array<string | undefined>): string {
  const seen = new Set<string>();

  return parts
    .flatMap((part) => normalizeSegments(part ?? ""))
    .filter((part) => {
      const key = part.toLowerCase();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .join("\n\n");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, "\"")
    .replace(/&#34;/gi, "\"")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function isStructuredJobSegment(segment: string, path: string): boolean {
  if (segment.length < 20 || looksLikeConfigBlob(segment)) {
    return false;
  }
  if (/\/assets\/|(?:^|\s)[/@a-z0-9_.-]+\.(?:js|css|png|svg|woff2?)(?:\s|$)/i.test(segment)) {
    return false;
  }
  if (/(themeoptions|customtheme|customfonts|microsite|vscdn|font-family|border-radius|background-color|stylesheet|favicon|logo|image\/|cdn)/i.test(segment)) {
    return false;
  }
  if (isBoilerplateSegment(segment)) {
    return false;
  }
  if (/(description|responsibilities|qualifications|requirements|jobposting|posting|aboutrole|whatyouwilldo|whatyoulldo|mission|team|about)/i.test(path)) {
    return true;
  }
  return scoreSegment(segment) >= 3;
}

function extractPrimaryHtml(html: string): string {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, " ");
  const htmlWithoutNoise = withoutComments
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<(nav|header|footer|form|aside|dialog)[^>]*>[\s\S]*?<\/\1>/gi, " ");

  const articleMatch = htmlWithoutNoise.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);
  if (articleMatch?.[0]) {
    return stripScripts(articleMatch[0]);
  }

  const bodyMatch = htmlWithoutNoise.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return stripScripts(bodyMatch?.[1] ?? htmlWithoutNoise);
}

function stripScripts(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ");
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
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"');
}

function normalizeSegments(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .map((item) => item.replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((item) => !isBoilerplateSegment(item))
    .filter((item) => !looksLikeConfigBlob(item));
}

function isBoilerplateSegment(segment: string): boolean {
  return /(privacy|cookies|sign in|sign-in|apply now|job alert|share this job|equal opportunity|accommodation|benefits|terms of use|page source|javascript required|skip to content|submit application)/i.test(segment);
}

function looksLikeConfigBlob(segment: string): boolean {
  const normalized = segment.toLowerCase();
  const assetReferenceCount = (segment.match(/\b(?:https?:\/\/\S+|\/\S+)\.(?:js|css|png|svg|woff2?)\b/gi) ?? []).length;

  return (
    /themeoptions|customtheme|customfonts|font-family|vscdn|microsite|src\\?https?:\/\/|background-color|border-radius|box-shadow|stylesheet|favicon|image\/png|cdn/.test(normalized) ||
    /\/assets\/|bootstrap\d?|videojs|googlemaps|markerclusterer|turbo_streams|controllers\/|font\.woff|favicon\.png/.test(normalized) ||
    assetReferenceCount >= 2 ||
    /[{[]\s*"?[a-z0-9_-]+"?\s*:/.test(segment) ||
    /&#34;/.test(segment)
  );
}

function scoreSegment(segment: string): number {
  let score = 0;
  const wordCount = segment.trim().split(/\s+/).length;

  if (segment.length <= 90 && !isBoilerplateSegment(segment) && wordCount >= 3) {
    score += 1;
  }
  if (/(responsibilities|qualifications|requirements|you will|about the role|preferred qualifications|what you'?ll do|what you will do|about the job|about the team)/i.test(segment)) {
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
  if (looksLikeConfigBlob(segment)) {
    score -= 5;
  }

  return score;
}

function scoreDocument(text: string): number {
  return normalizeSegments(text).reduce((sum, segment) => sum + Math.max(0, scoreSegment(segment)), 0);
}

function scoreCandidate(candidate: { text: string; source: string }): number {
  const sourceBias =
    candidate.source === "structured_with_meta"
      ? 10
      : candidate.source === "structured"
        ? 8
        : candidate.source === "primary_with_meta"
          ? 6
          : candidate.source === "primary"
            ? 4
            : 2;

  return scoreDocument(candidate.text) + sourceBias;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
