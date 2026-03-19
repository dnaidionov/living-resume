import { NextResponse } from "next/server";
import { analyzeUploadedRoleText } from "@/lib/ai/fit-analysis";
import { buildFitAnalysisLogContext } from "@/lib/logging/fit-analysis-log";
import { logEvent } from "@/lib/logging/logger";
import { parseUploadedRoleFile } from "@/lib/platform/file-intake";
import type { FitPresentationMode } from "@/types/ai";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sessionId = String(formData.get("sessionId") ?? "anonymous-session");
  const presentationMode = String(formData.get("presentationMode") ?? "recruiter_brief") as FitPresentationMode;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File upload is required." }, { status: 400 });
  }

  try {
    const text = await parseUploadedRoleFile(file);
    const result = await analyzeUploadedRoleText(text, sessionId, presentationMode);
    logEvent(
      "info",
      "fit_analysis_file_completed",
      buildFitAnalysisLogContext(
        {
          kind: "file",
          fileId: file.name,
          mimeType: file.type || "unknown"
        },
        result,
        presentationMode
      )
    );
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
