import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/knowledge-base/${id}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch document" },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Map ElevenLabs response into a shape your UI expects
    const transformed = {
      id: data.id,
      name: data.name,
      content: data.content || data.text || "No content returned by API",
      metadata: data.metadata,
    };

    return NextResponse.json(transformed);
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
