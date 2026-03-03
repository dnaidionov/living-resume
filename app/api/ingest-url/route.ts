import { NextResponse } from "next/server";
import { fetchJobDescriptionFromUrl } from "@/lib/platform/url-intake";

export async function POST(request: Request) {
  const payload = (await request.json()) as { url: string };

  try {
    const text = await fetchJobDescriptionFromUrl(payload.url);
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to ingest URL."
      },
      { status: 400 }
    );
  }
}
