import type { RetrievalStore } from "@/types/contracts";
import type { EvidenceChunk } from "@/types/content";
import { fileContentStore } from "@/lib/content/store";
import { computeDeterministicEmbedding, cosineSimilarity } from "@/lib/retrieval/embeddings";

function modeFilter(mode: "resume_qa" | "fit_analysis" | "build_process", chunk: EvidenceChunk): boolean {
  if (mode === "build_process") {
    return chunk.sourceType === "build_doc" || chunk.sourceType === "case_study";
  }
  return chunk.sourceType !== "build_doc";
}

export const staticRetrievalStore: RetrievalStore = {
  async searchEvidence(query, mode) {
    const documents = await fileContentStore.listDocuments();
    const chunks: EvidenceChunk[] = documents.map((document) => ({
      ...document,
      embedding: computeDeterministicEmbedding(`${document.title} ${document.section} ${document.text}`)
    }));

    const queryEmbedding = computeDeterministicEmbedding(query);

    return chunks
      .filter((chunk) => modeFilter(mode, chunk))
      .map((chunk) => ({
        chunk,
        score: cosineSimilarity(queryEmbedding, chunk.embedding)
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map(({ chunk }) => chunk);
  }
};
