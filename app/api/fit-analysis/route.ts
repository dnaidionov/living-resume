import { NextResponse } from "next/server";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import { logEvent } from "@/lib/logging/logger";
import { fetchJobDescriptionFromUrl } from "@/lib/platform/url-intake";
import type { FitAnalysisRequest } from "@/types/ai";

export async function POST(request: Request) {
  const payload = (await request.json()) as FitAnalysisRequest;

  try {
    const roleInput =
      payload.roleInput.kind === "url"
        ? {
            kind: "url" as const,
            url: payload.roleInput.url,
            content: await fetchJobDescriptionFromUrl(payload.roleInput.url)
          }
        : payload.roleInput;

    const result = await heuristicFitAnalysisService.analyze(
      roleInput,
      payload.sessionId,
      payload.presentationMode ?? "recruiter_brief"
    );
    logEvent("info", "fit_analysis_completed", {
      kind: payload.roleInput.kind,
      presentationMode: payload.presentationMode ?? "recruiter_brief"
    });
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
