export type DeployUrlEvalSummary = {
  totalRequired: number;
  passedIds: string[];
  failed: Array<{
    id: string;
    reason: string;
  }>;
};

export function shouldBlockDeployOnUrlEval(summary: DeployUrlEvalSummary): boolean {
  return summary.totalRequired > 0 && summary.passedIds.length === 0;
}

export function formatDeployUrlEvalSummary(summary: DeployUrlEvalSummary): string {
  const passed = `${summary.passedIds.length}/${summary.totalRequired}`;
  if (shouldBlockDeployOnUrlEval(summary)) {
    return `Blocked: all required external URL evals failed (${passed} passed).`;
  }

  if (summary.failed.length === 0) {
    return `Passed: all required external URL evals succeeded (${passed} passed).`;
  }

  return `Proceeding with warnings: ${summary.failed.length} required external URL eval case(s) were skipped (${passed} passed).`;
}
