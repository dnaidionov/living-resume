import { createHash } from "node:crypto";
import { buildDocuments } from "@/lib/content/store";

export type EmbeddingsArtifactManifest = {
  corpusFingerprint: string;
  documentCount: number;
};

export async function buildEmbeddingsArtifactManifest(): Promise<EmbeddingsArtifactManifest> {
  const documents = await buildDocuments();
  const canonicalPayload = JSON.stringify(
    documents.map((document) => ({
      id: document.id,
      sourceType: document.sourceType,
      title: document.title,
      section: document.section,
      text: document.text,
      tags: document.tags,
      metadata: document.metadata ?? {}
    }))
  );

  return {
    corpusFingerprint: createHash("sha256").update(canonicalPayload).digest("hex"),
    documentCount: documents.length
  };
}
