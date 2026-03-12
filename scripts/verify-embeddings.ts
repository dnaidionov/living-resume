import path from "node:path";
import { readFile } from "node:fs/promises";
import { loadLocalEnv } from "@/lib/env/load-local-env";
import { buildEmbeddingsArtifactManifest, type EmbeddingsArtifactManifest } from "@/lib/retrieval/artifact-manifest";

async function main() {
  loadLocalEnv();

  const manifestPath = path.join(process.cwd(), "content/retrieval/embeddings.manifest.json");
  let committedManifest: EmbeddingsArtifactManifest;

  try {
    committedManifest = JSON.parse(await readFile(manifestPath, "utf8")) as EmbeddingsArtifactManifest;
  } catch {
    throw new Error(
      "Missing content/retrieval/embeddings.manifest.json. Run `npm run embeddings:build` to regenerate committed retrieval artifacts."
    );
  }

  const currentManifest = await buildEmbeddingsArtifactManifest();

  if (
    committedManifest.corpusFingerprint !== currentManifest.corpusFingerprint ||
    committedManifest.documentCount !== currentManifest.documentCount
  ) {
    throw new Error(
      "Indexed content changed but embeddings are stale. Run `npm run embeddings:build` and commit both retrieval artifacts."
    );
  }

  console.log("Embeddings manifest matches the current indexed content.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
