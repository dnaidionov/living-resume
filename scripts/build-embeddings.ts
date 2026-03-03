import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildDocuments } from "@/lib/content/store";
import { computeDeterministicEmbedding } from "@/lib/retrieval/embeddings";

async function main() {
  const documents = await buildDocuments();
  const embeddings = documents.map((document) => ({
    ...document,
    embedding: computeDeterministicEmbedding(`${document.title} ${document.section} ${document.text}`)
  }));

  const outputPath = path.join(process.cwd(), "embeddings.json");
  await writeFile(outputPath, JSON.stringify(embeddings, null, 2), "utf8");
  console.log(`Wrote ${embeddings.length} embeddings to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
