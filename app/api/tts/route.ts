import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();

  const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice_settings: { stability: 0.75, similarity_boost: 0.75 },
    }),
  });

  const arrayBuffer = await response.arrayBuffer();
  return new NextResponse(arrayBuffer, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
