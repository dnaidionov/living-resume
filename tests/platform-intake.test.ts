import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseUploadedRoleFile } from "@/lib/platform/file-intake";
import { analyzeUploadedRoleText, uploadedRoleRequirementsMissingError } from "@/lib/ai/fit-analysis";
import { extractJobTargetSummary, extractReadableText, fetchJobDescriptionFromUrl } from "@/lib/platform/url-intake";

const uploadedRoleFixturesDir = path.join(process.cwd(), "tests/fixtures/uploaded-role-files");
const uploadedRoleFixtureNames = readdirSync(uploadedRoleFixturesDir).sort();
const validBinaryFixtureNames = findUploadedRoleFixtureNames("valid jd", [".pdf", ".docx"]);
const nonJobDescriptionFixtureNames = findUploadedRoleFixtureNames("non jd", [".pdf", ".docx"]);
const unsupportedFixtureNames = findUploadedRoleFixtureNames("unsupported format");

test("extractReadableText strips markup and keeps readable content", () => {
  const html = `
    <html>
      <head><style>.hidden { display:none; }</style></head>
      <body>
        <header><a href="/jobs">Jobs</a><button>Apply now</button></header>
        <script>console.log("ignore")</script>
        <main>
          <h1>Senior AI Product Manager</h1>
          <p>About the role</p>
          <p>Lead product strategy for LLM-based workflows.</p>
          <ul><li>Own roadmap</li><li>Work cross-functionally</li></ul>
          <footer>Privacy Cookies Equal opportunity</footer>
        </main>
      </body>
    </html>
  `;

  const text = extractReadableText(html);
  assert.match(text, /Senior AI Product Manager/);
  assert.match(text, /Lead product strategy for LLM-based workflows/);
  assert.match(text, /Own roadmap/);
  assert.doesNotMatch(text, /console\.log/);
  assert.doesNotMatch(text, /Apply now|Privacy|Cookies|Equal opportunity/);
});

test("extractReadableText prefers structured job payloads over config blobs", () => {
  const html = `
    <html>
      <body>
        <main>
          <div>{"themeOptions":{"customTheme":{"customFonts":[{"src":"https://static.vscdn.net/images/careers/demo/netflix/font.woff"}]}}}</div>
        </main>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Senior Product Manager",
            "description": "<p>About the role</p><p>Lead product strategy and roadmap planning.</p><ul><li>Drive cross-functional execution</li><li>Partner with engineering and design</li></ul>"
          }
        </script>
      </body>
    </html>
  `;

  const text = extractReadableText(html);
  assert.match(text, /Lead product strategy and roadmap planning/);
  assert.match(text, /Drive cross-functional execution/);
  assert.doesNotMatch(text, /themeOptions|customTheme|customFonts|vscdn/);
});

test("extractReadableText can recover job content from embedded ATS JSON", () => {
  const html = `
    <html>
      <body>
        <script>
          {
            "jobPosting": {
              "title": "Senior Product Manager",
              "responsibilities": [
                "Develop product requirements and roadmap",
                "Drive alignment across engineering, design, and operations"
              ],
              "qualifications": [
                "Experience introducing new technology",
                "Ability to gather and synthesize large amounts of information"
              ]
            }
          }
        </script>
      </body>
    </html>
  `;

  const text = extractReadableText(html);
  assert.match(text, /Develop product requirements and roadmap/);
  assert.match(text, /Drive alignment across engineering, design, and operations/);
  assert.match(text, /Experience introducing new technology/);
});

test("extractReadableText decodes HTML-encoded JSON-LD descriptions", () => {
  const html = `
    <html>
      <body>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "description": "&lt;p&gt;About the role&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Lead product strategy&lt;/li&gt;&lt;li&gt;Drive cross-functional delivery&lt;/li&gt;&lt;/ul&gt;"
          }
        </script>
      </body>
    </html>
  `;

  const text = extractReadableText(html);
  assert.match(text, /Lead product strategy/);
  assert.match(text, /Drive cross-functional delivery/);
});

test("extractReadableText recovers Ashby-style descriptionHtml payloads", () => {
  const html = `
    <html>
      <body>
        <script>
          {
            "posting": {
              "title": "Director of Product",
              "descriptionHtml": "<p><strong>Company</strong> mission text.</p><h2>The qualifications you need:</h2><ul><li>7+ years of experience in Product Management</li><li>Proven experience owning product strategy</li></ul>"
            }
          }
        </script>
      </body>
    </html>
  `;

  const text = extractReadableText(html);
  assert.match(text, /7\+ years of experience in Product Management/);
  assert.match(text, /Proven experience owning product strategy/);
});

test("extractReadableText falls back to title and meta description when body content is sparse", () => {
  const html = `
    <html>
      <head>
        <title>Senior Product Manager</title>
        <meta name="description" content="Lead product strategy, roadmap planning, and cross-functional execution for a SaaS platform.">
      </head>
      <body>
        <div>Enable JavaScript to run this app.</div>
      </body>
    </html>
  `;

  const text = extractReadableText(html);
  assert.match(text, /Senior Product Manager/);
  assert.match(text, /Lead product strategy, roadmap planning, and cross-functional execution/i);
});

test("extractJobTargetSummary prefers structured company and title from JSON-LD", () => {
  const html = `
    <html>
      <head>
        <title>Ignore This | Example</title>
        <meta property="og:site_name" content="Wrong Company">
      </head>
      <body>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": "Staff Product Manager, Driver Experience",
            "hiringOrganization": { "name": "Uber" },
            "description": "<p>Own the roadmap.</p>"
          }
        </script>
      </body>
    </html>
  `;

  assert.deepEqual(
    extractJobTargetSummary(html, "https://careers.uber.com/us/en/job/123"),
    {
      roleTitle: "Staff Product Manager, Driver Experience",
      companyName: "Uber",
      displayLabel: "Staff Product Manager, Driver Experience - Uber"
    }
  );
});

test("extractJobTargetSummary can recover company from page metadata and URL fallback", () => {
  const html = `
    <html>
      <head>
        <title>Product Manager, Driving Behaviors | Mountain View | Waymo</title>
      </head>
      <body>
        <main>
          <h1>Product Manager, Driving Behaviors</h1>
        </main>
      </body>
    </html>
  `;

  assert.deepEqual(
    extractJobTargetSummary(
      html,
      "https://careers.withwaymo.com/jobs/product-manager-driving-behaviors-mountain-view-california"
    ),
    {
      roleTitle: "Product Manager, Driving Behaviors",
      companyName: "Waymo",
      displayLabel: "Product Manager, Driving Behaviors - Waymo"
    }
  );
});

test("extractJobTargetSummary supplements structured title-only metadata with URL-derived company fallback", () => {
  const html = `
    <html>
      <body>
        <script>
          {
            "posting": {
              "title": "Staff Product Manager, Telematics",
              "descriptionHtml": "<p>Own the roadmap.</p>"
            }
          }
        </script>
      </body>
    </html>
  `;

  assert.deepEqual(
    extractJobTargetSummary(html, "https://job-boards.greenhouse.io/gomotive/jobs/8303849002"),
    {
      roleTitle: "Staff Product Manager, Telematics",
      companyName: "Motive",
      displayLabel: "Staff Product Manager, Telematics - Motive"
    }
  );
});

test("extractJobTargetSummary prefers visible body role title when metadata title conflicts", () => {
  const html = `
    <html>
      <head>
        <title>Head of Product @ Sourgum</title>
        <meta property="og:title" content="Head of Product" />
      </head>
      <body>
        <main>
          <p><strong>Sourgum</strong> is transforming waste operations.</p>
          <h2>The Role:</h2>
          <p>As the Director of Product, you will own strategy and execution across the product organization.</p>
        </main>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": "Head of Product",
            "hiringOrganization": { "name": "Sourgum" },
            "description": "<p><strong>Sourgum</strong> is transforming waste operations.</p><h2>The Role:</h2><p>As the Director of Product, you will own strategy and execution across the product organization.</p>"
          }
        </script>
      </body>
    </html>
  `;

  assert.deepEqual(
    extractJobTargetSummary(html, "https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6"),
    {
      roleTitle: "Director of Product",
      companyName: "Sourgum",
      displayLabel: "Director of Product - Sourgum"
    }
  );
});

test("fetchJobDescriptionFromUrl reports JS-rendered pages explicitly when content cannot be recovered", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("<html><body><div>Enable JavaScript to run this app.</div></body></html>", {
      status: 200,
      headers: { "content-type": "text/html" }
    });

  try {
    await assert.rejects(
      () => fetchJobDescriptionFromUrl("https://example.com/job"),
      /heavily JavaScript-rendered/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchJobPostingFromUrl caches repeated URL fetches for the same posting", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(
      "<html><head><title>Staff Product Manager | Example | Acme</title></head><body><main><h1>Staff Product Manager</h1><p>Lead product strategy, roadmap planning, customer discovery, backlog prioritization, and cross-functional delivery for a B2B SaaS platform.</p><ul><li>Own roadmap definition</li><li>Partner with engineering and design</li></ul></main></body></html>",
      {
        status: 200,
        headers: { "content-type": "text/html" }
      }
    );
  };

  try {
    const { fetchJobPostingFromUrl } = await import("@/lib/platform/url-intake");
    const first = await fetchJobPostingFromUrl("https://example.com/jobs/123");
    const second = await fetchJobPostingFromUrl("https://example.com/jobs/123");

    assert.equal(calls, 1);
    assert.deepEqual(second, first);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchJobPostingFromUrl can bypass repeated URL cache entries when requested", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(
      "<html><head><title>Product Manager | Example | Acme</title></head><body><main><h1>Product Manager</h1><p>Lead roadmap, backlog management, and cross-functional delivery for a B2B SaaS platform.</p><ul><li>Own roadmap definition</li><li>Partner with engineering and design</li></ul></main></body></html>",
      {
        status: 200,
        headers: { "content-type": "text/html" }
      }
    );
  };

  try {
    const { fetchJobPostingFromUrl } = await import("@/lib/platform/url-intake");
    const first = await fetchJobPostingFromUrl("https://example.com/jobs/456", { useCache: false });
    const second = await fetchJobPostingFromUrl("https://example.com/jobs/456", { useCache: false });

    assert.equal(calls, 2);
    assert.deepEqual(second, first);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("parseUploadedRoleFile reads plain text files", async () => {
  const file = new File(["Lead AI platform product strategy and execution."], "role.txt", {
    type: "text/plain"
  });

  const text = await parseUploadedRoleFile(file);
  assert.equal(text, "Lead AI platform product strategy and execution.");
});

for (const fixtureName of validBinaryFixtureNames) {
  test(`parseUploadedRoleFile extracts readable text from fixture ${fixtureName}`, async () => {
    const file = createUploadedRoleFixtureFile(fixtureName);
    const text = await parseUploadedRoleFile(file);

    assert.ok(text.trim().length >= 80, `${fixtureName} parsed too little text.`);
    assert.match(text, /(product|manager|director|architect|requirements|responsibilities|experience)/i);
  });
}

for (const fixtureName of validBinaryFixtureNames) {
  test(`parseUploadedRoleFile infers mime type from filename for fixture ${fixtureName}`, async () => {
    const file = createUploadedRoleFixtureFile(fixtureName, { omitMimeType: true });
    const text = await parseUploadedRoleFile(file);

    assert.ok(text.trim().length >= 80, `${fixtureName} failed filename-based mime inference.`);
  });
}

for (const fixtureName of unsupportedFixtureNames) {
  test(`parseUploadedRoleFile rejects unsupported fixture ${fixtureName}`, async () => {
    const file = createUploadedRoleFixtureFile(fixtureName);
    await assert.rejects(() => parseUploadedRoleFile(file), /Unsupported file type/i);
  });
}

test("parseUploadedRoleFile rejects empty text files", async () => {
  const file = new File(["   \n\t  "], "role.txt", {
    type: "text/plain"
  });

  await assert.rejects(() => parseUploadedRoleFile(file), /did not contain readable text/i);
});

test("uploaded TXT fit analysis rejects readable files with no extractable job requirements", async () => {
  const file = new File(["Welcome to the company handbook and benefits overview."], "role.txt", {
    type: "text/plain"
  });

  const text = await parseUploadedRoleFile(file);
  await assert.rejects(
    () => analyzeUploadedRoleText(text, "test-session", "recruiter_brief", { extractRequirements: async () => [] }),
    new RegExp(uploadedRoleRequirementsMissingError.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  );
});

for (const fixtureName of nonJobDescriptionFixtureNames) {
  test(`uploaded fixture ${fixtureName} rejects readable files with no extractable job requirements`, async () => {
    const text = await parseUploadedRoleFile(createUploadedRoleFixtureFile(fixtureName));

    await assert.rejects(
      () => analyzeUploadedRoleText(text, "test-session", "recruiter_brief", { extractRequirements: async () => [] }),
      new RegExp(uploadedRoleRequirementsMissingError.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  });
}

test("uploaded TXT fit analysis succeeds when readable job requirements are extracted", async () => {
  const file = new File(["Senior Product Manager\nLead roadmap and product requirements with engineering."], "role.txt", {
    type: "text/plain"
  });

  const text = await parseUploadedRoleFile(file);
  const result = await analyzeUploadedRoleText(text, "test-session", "recruiter_brief", {
    extractRequirements: async () => [
      {
        text: "Lead roadmap and product requirements with engineering.",
        category: "function",
        priority: "important"
      }
    ],
    resolveEvidence: async () => [],
    generateAnalysis: async (_roleText, _requirements, _evidence, inputKind, presentationMode, targetSummary) => ({
      presentation: {
        mode: "recruiter_brief",
        overallMatch: {
          verdict: "probably_a_good_fit",
          label: "Probably a Good Fit"
        },
        recommendation: "Worth a deeper look."
      },
      internal: {
        overallSummary: "Good fit.",
        overallScore: 7,
        dimensions: [],
        strengths: [],
        gaps: [],
        transferableAdvantages: [],
        interviewAngles: []
      },
      citations: [],
      confidence: "medium",
      metadata: {
        evaluatorVersion: "test",
        inputKind,
        presentationMode,
        targetSummary
      }
    })
  });

  assert.equal(result.metadata?.inputKind, "file");
  assert.match(result.metadata?.targetSummary?.roleTitle ?? "", /Senior Product Manager/);
});

for (const fixtureName of validBinaryFixtureNames) {
  test(`uploaded fixture ${fixtureName} succeeds when readable job requirements are extracted`, async () => {
    const text = await parseUploadedRoleFile(createUploadedRoleFixtureFile(fixtureName));
    const result = await analyzeUploadedRoleText(text, "test-session", "recruiter_brief", {
      extractRequirements: async () => [
        {
          text: "Lead roadmap and product requirements with engineering.",
          category: "function",
          priority: "important"
        }
      ],
      resolveEvidence: async () => [],
      generateAnalysis: async (_roleText, _requirements, _evidence, inputKind, presentationMode, targetSummary) => ({
        presentation: {
          mode: "recruiter_brief",
          overallMatch: {
            verdict: "probably_a_good_fit",
            label: "Probably a Good Fit"
          },
          recommendation: "Worth a deeper look."
        },
        internal: {
          overallSummary: "Good fit.",
          overallScore: 7,
          dimensions: [],
          strengths: [],
          gaps: [],
          transferableAdvantages: [],
          interviewAngles: []
        },
        citations: [],
        confidence: "medium",
        metadata: {
          evaluatorVersion: "test",
          inputKind,
          presentationMode,
          targetSummary
        }
      })
    });

    assert.equal(result.metadata?.inputKind, "file");
    assert.equal(result.presentation.mode, "recruiter_brief");
  });
}

function findUploadedRoleFixtureNames(prefix: string, extensions?: string[]): string[] {
  return uploadedRoleFixtureNames.filter((name) => {
    if (!name.startsWith(prefix)) {
      return false;
    }

    if (!extensions || extensions.length === 0) {
      return true;
    }

    const normalized = name.toLowerCase();
    return extensions.some((extension) => normalized.endsWith(extension));
  });
}

function createUploadedRoleFixtureFile(filename: string, options?: { omitMimeType?: boolean }): File {
  const fixturePath = path.join(uploadedRoleFixturesDir, filename);
  const contents = readFileSync(fixturePath);
  const mimeType = options?.omitMimeType ? "" : inferFixtureMimeType(filename);
  return new File([contents], filename, mimeType ? { type: mimeType } : undefined);
}

function inferFixtureMimeType(filename: string): string {
  const normalized = filename.toLowerCase();
  if (normalized.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (normalized.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (normalized.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "application/octet-stream";
}
