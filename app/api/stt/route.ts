import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.arrayBuffer();

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      "Content-Type": "audio/ogg", // <- updated
    },
    body,
  });

  const data = await response.json();

  console.log("STT Response:", data);

  return NextResponse.json({ text: data.text || "Could not transcribe." });
}
