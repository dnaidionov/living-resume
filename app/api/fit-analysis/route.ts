import { NextResponse } from "next/server";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import { logEvent } from "@/lib/logging/logger";
import { fetchJobDescriptionFromUrl } from "@/lib/platform/url-intake";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    roleInput: { kind: "text"; text: string } | { kind: "url"; url: string } | { kind: "file"; fileId: string; mimeType: string };
    sessionId: string;
  };

  try {
    const roleInput =
      payload.roleInput.kind === "url"
        ? {
            kind: "text" as const,
            text: await fetchJobDescriptionFromUrl(payload.roleInput.url)
          }
        : payload.roleInput;

    const result = await heuristicFitAnalysisService.analyze(roleInput, payload.sessionId);
    logEvent("info", "fit_analysis_completed", { kind: payload.roleInput.kind });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze role."
      },
      { status: 400 }
    );
  }
}
