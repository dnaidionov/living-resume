export async function parseUploadedRoleFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer).trim();

  if (text.length > 0) {
    return text;
  }

  if (file.type === "application/pdf" || file.type.includes("wordprocessingml")) {
    throw new Error(
      "Binary PDF and DOCX parsing requires parser dependencies that should be added before production launch."
    );
  }

  throw new Error("Unable to parse uploaded file.");
}
