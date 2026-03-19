import { spawnSync } from "node:child_process";
import { loadLocalEnv } from "@/lib/env/load-local-env";
import { buildCloudflareDeploymentPlan } from "@/lib/deploy/cloudflare-env";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env
  });

  if (typeof result.status === "number" && result.status !== 0) {
    process.exitCode = result.status;
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }

  if (result.error) {
    throw result.error;
  }
}

function main() {
  loadLocalEnv();

  const plan = buildCloudflareDeploymentPlan();
  console.log("Cloudflare environment configuration to deploy:");
  console.log(JSON.stringify({
    variables: plan.variables,
    secrets: Object.fromEntries(
      Object.entries(plan.secrets).map(([name, secretPlan]) => [name, secretPlan.present ? "present" : "missing"])
    ),
    missing: plan.missing
  }, null, 2));

  if (!plan.valid) {
    throw new Error(`Cloudflare deployment is blocked. Missing required deployment values: ${plan.missing.join(", ")}`);
  }

  if (!hasFlag("--confirm-env")) {
    throw new Error("Cloudflare deployment is blocked until you verify the configuration above and rerun with --confirm-env.");
  }

  run("npm", ["run", "cf:build"]);
  run("npx", ["opennextjs-cloudflare", "deploy"]);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
