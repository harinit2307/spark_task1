// app/api/knowledge-base/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/knowledge-base/${id}/content`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch document content", details: errorText },
        { status: res.status }
      );
    }

    const content = await res.text(); // 👈 get the full text content
    return NextResponse.json({ id, content });
  } catch (err: any) {
    console.error("Error fetching document content:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
