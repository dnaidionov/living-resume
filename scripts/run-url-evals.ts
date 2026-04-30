import { spawnSync } from "node:child_process";
import { loadLocalEnv } from "@/lib/env/load-local-env";

function main() {
  loadLocalEnv();

  const deployMode = process.env.DEPLOY_URL_EVAL_MODE === "deploy";
  const script = deployMode ? "test:url-evals:deploy" : "test:url-evals";

  const result = spawnSync("npm", ["run", script], {
    stdio: "inherit",
    env: process.env
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exitCode = result.status;
    throw new Error(`${script} failed with exit code ${result.status}`);
  }

  if (result.error) {
    throw result.error;
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
