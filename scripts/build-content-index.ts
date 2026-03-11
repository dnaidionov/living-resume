import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDocuments } from "@/lib/content/store";
import { loadLocalEnv } from "@/lib/env/load-local-env";

async function main() {
  loadLocalEnv();

  const documents = await buildDocuments();
  const outputPath = path.join(process.cwd(), "content-index.json");
  await writeFile(outputPath, JSON.stringify(documents, null, 2), "utf8");
  console.log(`Wrote ${documents.length} content documents to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
