import type { RetrievalStore } from "@/types/contracts";
import type { EvidenceChunk } from "@/types/content";
import { buildDocuments } from "@/lib/content/store";
import { computeDeterministicEmbedding, cosineSimilarity } from "@/lib/retrieval/embeddings";
import { requestEmbeddings } from "@/lib/ai/openai";
import { hasProviderConfig } from "@/lib/ai/provider-config";
import generatedEmbeddings from "@/content/retrieval/embeddings.generated.json";

type EmbeddedChunk = EvidenceChunk & {
  embedding: number[];
};

let liveSemanticChunksPromise: Promise<EmbeddedChunk[]> | null = null;

function modeFilter(mode: "resume_qa" | "fit_analysis" | "build_process", chunk: EvidenceChunk): boolean {
  if (mode === "build_process") {
    return chunk.sourceType === "build_doc" || chunk.sourceType === "case_study";
  }
  if (mode === "fit_analysis") {
    return chunk.sourceType === "resume" || chunk.sourceType === "ai_context";
  }
  return chunk.sourceType !== "build_doc";
}

export const staticRetrievalStore: RetrievalStore = {
  async searchEvidence(query, mode) {
    const [result] = await this.searchEvidenceBatch([query], mode);
    return result ?? [];
  },

  async searchEvidenceBatch(queries, mode) {
    const chunks = await loadEmbeddedChunks();
    const limit = mode === "fit_analysis" ? 12 : 5;
    const queryEmbeddings = await embedQueries(queries, usesSemanticEmbeddings(chunks));
    const filteredChunks = chunks.filter((chunk) => modeFilter(mode, chunk));

    return queryEmbeddings.map((queryEmbedding) =>
      filteredChunks
        .map((chunk) => ({
          chunk,
          score: cosineSimilarity(queryEmbedding, chunk.embedding)
        }))
        .sort((left, right) => right.score - left.score)
        .slice(0, limit)
        .map(({ chunk }) => chunk)
    );
  }
};

function usesSemanticEmbeddings(chunks: EmbeddedChunk[]): boolean {
  const first = chunks[0]?.embedding;
  return Array.isArray(first) && first.length > 24;
}

async function embedQueries(queries: string[], semantic: boolean): Promise<number[][]> {
  if (queries.length === 0) {
    return [];
  }

  if (!semantic) {
    return queries.map((query) => computeDeterministicEmbedding(query));
  }

  try {
    const embeddings = await requestEmbeddings(queries);
    return queries.map((query, index) => embeddings[index] ?? computeDeterministicEmbedding(query));
  } catch {
    return queries.map((query) => computeDeterministicEmbedding(query));
  }
}

async function loadEmbeddedChunks(): Promise<EmbeddedChunk[]> {
  const staticChunks = normalizeEmbeddedChunks(generatedEmbeddings as EmbeddedChunk[]);
  if (staticChunks.length > 0) {
    return staticChunks;
  }

  if (!hasProviderConfig("embeddings")) {
    return buildDeterministicChunks();
  }

  if (!liveSemanticChunksPromise) {
    liveSemanticChunksPromise = buildSemanticChunks();
  }

  try {
    return await liveSemanticChunksPromise;
  } catch {
    liveSemanticChunksPromise = null;
    return buildDeterministicChunks();
  }
}

async function buildDeterministicChunks(): Promise<EmbeddedChunk[]> {
  const documents = await buildDocuments();
  return documents.map((document) => ({
    ...document,
    embedding: computeDeterministicEmbedding(`${document.title} ${document.section} ${document.text}`)
  }));
}

async function buildSemanticChunks(): Promise<EmbeddedChunk[]> {
  const documents = await buildDocuments();
  const inputs = documents.map((document) => `${document.title}\n${document.section}\n${document.text}`);
  const vectors = await embedInBatches(inputs, 64);
  return documents.map((document, index) => ({
    ...document,
    embedding: vectors[index] ?? computeDeterministicEmbedding(inputs[index] ?? document.text)
  }));
}

async function embedInBatches(inputs: string[], batchSize: number): Promise<number[][]> {
  const result: number[][] = [];
  for (let index = 0; index < inputs.length; index += batchSize) {
    const batch = inputs.slice(index, index + batchSize);
    const vectors = await requestEmbeddings(batch);
    result.push(...vectors);
  }
  return result;
}

function normalizeEmbeddedChunks(chunks: EmbeddedChunk[]): EmbeddedChunk[] {
  return (chunks ?? []).filter((item) => Array.isArray(item.embedding) && item.embedding.length > 0);
}
