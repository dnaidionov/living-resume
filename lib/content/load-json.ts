import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadJsonFile<T>(relativePath: string): Promise<T> {
  const filePath = path.join(process.cwd(), relativePath);
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}
