import { NextResponse } from "next/server";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import { resolveRoleInputForAnalysis } from "@/lib/ai/fit-analysis-input";
import { logEvent } from "@/lib/logging/logger";
import type { FitAnalysisRequest } from "@/types/ai";

export async function POST(request: Request) {
  const payload = (await request.json()) as FitAnalysisRequest;

  try {
    const roleInput = await resolveRoleInputForAnalysis(payload.roleInput);

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
