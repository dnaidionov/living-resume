import test from "node:test";
import assert from "node:assert/strict";
import JSZip from "jszip";
import { parseUploadedRoleFile } from "@/lib/platform/file-intake";
import { extractReadableText } from "@/lib/platform/url-intake";

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
