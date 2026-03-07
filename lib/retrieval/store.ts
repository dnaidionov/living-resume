import type { RetrievalStore } from "@/types/contracts";
import type { EvidenceChunk } from "@/types/content";
import embeddings from "@/embeddings.json";
import { computeDeterministicEmbedding, cosineSimilarity } from "@/lib/retrieval/embeddings";

function modeFilter(mode: "resume_qa" | "fit_analysis" | "build_process", chunk: EvidenceChunk): boolean {
  if (mode === "build_process") {
    return chunk.sourceType === "build_doc" || chunk.sourceType === "case_study";
  }
  return chunk.sourceType !== "build_doc";
}

export const staticRetrievalStore: RetrievalStore = {
  async searchEvidence(query, mode) {
    const queryEmbedding = computeDeterministicEmbedding(query);
    const chunks = embeddings as EvidenceChunk[];

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
