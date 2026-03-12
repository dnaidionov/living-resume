import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDocuments } from "@/lib/content/store";
import { loadLocalEnv } from "@/lib/env/load-local-env";
import { requestEmbeddings } from "@/lib/ai/openai";
import { buildEmbeddingsArtifactManifest } from "@/lib/retrieval/artifact-manifest";

async function main() {
  loadLocalEnv();

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to build semantic embeddings.");
  }

  const documents = await buildDocuments();
  const vectors = await requestEmbeddings(documents.map((document) => `${document.title}\n${document.section}\n${document.text}`));
  const embeddings = documents.map((document, index) => ({
    ...document,
    embedding: vectors[index] ?? []
  }));

  const outputPath = path.join(process.cwd(), "content/retrieval/embeddings.generated.json");
  const manifestPath = path.join(process.cwd(), "content/retrieval/embeddings.manifest.json");
  const manifest = await buildEmbeddingsArtifactManifest();
  await writeFile(outputPath, JSON.stringify(embeddings, null, 2), "utf8");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Wrote ${embeddings.length} embeddings to ${outputPath}`);
  console.log(`Wrote embeddings manifest to ${manifestPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
