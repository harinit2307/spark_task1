import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `
You are a helpful AI assistant for ElevenLabs. Answer only questions related to ElevenLabs features, APIs, voice technology, and platform usage.
If the user asks something unrelated, politely respond that you are only trained to help with ElevenLabs.
`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ];

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3-8b-instruct",
        messages,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("OpenRouter Error:", error);
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "No response.";

    return NextResponse.json({ answer: reply });
  } catch (error) {
    console.error("Convo route error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
