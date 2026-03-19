import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { parseUploadedRoleFile } from "@/lib/platform/file-intake";
import { extractJobTargetSummary, extractReadableText, fetchJobDescriptionFromUrl } from "@/lib/platform/url-intake";

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

test("parseUploadedRoleFile extracts DOCX text", async () => {
  const zip = new JSZip();
  zip.file(
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Senior Product Manager</w:t></w:r></w:p>
        <w:p><w:r><w:t>Lead roadmap for AI systems</w:t></w:r></w:p>
      </w:body>
    </w:document>`
  );

  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  const file = new File([buffer], "role.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  });

  const text = await parseUploadedRoleFile(file);
  assert.match(text, /Senior Product Manager/);
  assert.match(text, /Lead roadmap for AI systems/);
});
