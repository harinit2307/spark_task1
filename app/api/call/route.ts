//app/api/call/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agent_id, phone_number } = body;

    if (!agent_id || !phone_number) {
      return NextResponse.json(
        { error: "Missing agent_id or phone_number" },
        { status: 400 }
      );
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_API_KEY" },
        { status: 500 }
      );
    }

    // Call ElevenLabs Twilio outbound call API
    const response = await fetch(
      "https://api.elevenlabs.io/v1/twilio/outbound-call",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id,
          phone_number,
        }),
      }
    );

    const text = await response.text();
    if (!response.ok) {
      console.error("ElevenLabs outbound call failed:", text);
      return NextResponse.json(
        { error: "Failed to start outbound call", details: text },
        { status: response.status }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json({ message: "Call started", data });
  } catch (err) {
    console.error("POST /api/call error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
