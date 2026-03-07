import JSZip from "jszip";

const supportedTextMimeTypes = new Set(["text/plain", "text/markdown", "application/json"]);

export async function parseUploadedRoleFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || inferMimeType(file.name);

  if (supportedTextMimeTypes.has(mimeType)) {
    return decodePlainText(buffer);
  }

  if (mimeType === "application/pdf") {
    return parsePdf(buffer);
  }

  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return parseDocx(buffer);
  }

  const decoded = decodePlainText(buffer);
  if (decoded) {
    return decoded;
  }

  throw new Error("Unsupported file type. Upload TXT, PDF, or DOCX.");
}

function decodePlainText(buffer: ArrayBuffer): string {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer).trim();
  if (!text) {
    throw new Error("Uploaded file did not contain readable text.");
  }
  return text;
}

async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true
  }).promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (lines) {
      pages.push(lines);
    }
  }

  const text = pages.join("\n\n").trim();
  if (!text) {
    throw new Error("Unable to extract readable text from the uploaded PDF.");
  }

  return text;
}

async function parseDocx(buffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file("word/document.xml")?.async("string");

  if (!documentXml) {
    throw new Error("Unable to extract text from the uploaded DOCX file.");
  }

  const text = documentXml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<w:tab\/>/g, " ")
    .replace(/<w:br\/>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .trim();

  if (!text) {
    throw new Error("Unable to extract readable text from the uploaded DOCX file.");
  }

  return text;
}

function inferMimeType(filename: string): string {
  const normalized = filename.toLowerCase();
  if (normalized.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (normalized.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (normalized.endsWith(".txt") || normalized.endsWith(".md")) {
    return "text/plain";
  }
  return "application/octet-stream";
}
