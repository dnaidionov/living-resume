import { NextResponse } from "next/server";
import { heuristicFitAnalysisService } from "@/lib/ai/fit-analysis";
import { resolveRoleInputForAnalysis } from "@/lib/ai/fit-analysis-input";
import { buildFitAnalysisLogContext } from "@/lib/logging/fit-analysis-log";
import { logEvent } from "@/lib/logging/logger";
import type { FitAnalysisRequest } from "@/types/ai";

export async function POST(request: Request) {
  const payload = (await request.json()) as FitAnalysisRequest;
  const presentationMode = payload.presentationMode ?? "recruiter_brief";

  try {
    const roleInput = await resolveRoleInputForAnalysis(payload.roleInput);

    const result = await heuristicFitAnalysisService.analyze(roleInput, payload.sessionId, presentationMode);
    logEvent("info", "fit_analysis_completed", buildFitAnalysisLogContext(roleInput, result, presentationMode));
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
