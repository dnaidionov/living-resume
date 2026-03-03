import crypto from "node:crypto";

export function computeDeterministicEmbedding(text: string, dimensions = 24): number[] {
  const hash = crypto.createHash("sha256").update(text).digest();
  const values = Array.from({ length: dimensions }, (_, index) => {
    const byte = hash[index % hash.length] ?? 0;
    return (byte / 255) * 2 - 1;
  });
  return normalize(values);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    dot += left * right;
    magA += left * left;
    magB += right * right;
  }

  if (!magA || !magB) {
    return 0;
  }

  return dot / Math.sqrt(magA * magB);
}

function normalize(values: number[]): number[] {
  const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) {
    return values;
  }
  return values.map((value) => value / magnitude);
}
