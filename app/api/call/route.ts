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

    // 📌 Split multiple numbers (comma-separated)
    const numbers = phone_number
      .split(",")
      .map((n: string) => n.trim())
      .filter((n: string) => n);

    // 📌 Fire calls in parallel
    const results = await Promise.all(
      numbers.map(async (num: string) => {
        const response = await fetch(
          "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
          {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agent_id,
              agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
              to_number: num,
            }),
          }
        );

        const text = await response.text();
        return {
          number: num,
          ok: response.ok,
          data: text ? JSON.parse(text) : {},
        };
      })
    );

    return NextResponse.json({
      message: "Calls started",
      results,
    });
  } catch (err) {
    console.error("POST /api/call error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
