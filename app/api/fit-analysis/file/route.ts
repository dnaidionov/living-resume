import { NextResponse } from "next/server";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import { logEvent } from "@/lib/logging/logger";
import { parseUploadedRoleFile } from "@/lib/platform/file-intake";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sessionId = String(formData.get("sessionId") ?? "anonymous-session");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File upload is required." }, { status: 400 });
  }

  try {
    const text = await parseUploadedRoleFile(file);
    const result = await heuristicFitAnalysisService.analyze({ kind: "text", text }, sessionId);
    logEvent("info", "fit_analysis_file_completed", { mimeType: file.type || "unknown" });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to parse uploaded role file."
      },
      { status: 400 }
    );
  }
}
