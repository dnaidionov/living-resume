export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "LivingResumeBot/0.1"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job description from ${url}`);
  }

  const html = await response.text();
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const normalized = text.replace(/\s+/g, " ").trim();

  if (normalized.length < 200) {
    throw new Error("Fetched page did not contain enough readable job description content.");
  }

  return normalized;
}
