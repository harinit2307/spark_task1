import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000', // Update for deployed URL
      'X-Title': 'ChatApp',
    },
    body: JSON.stringify({
      model: 'mistral/mistral-7b-instruct', // Free model
      messages,
    }),
  });

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? 'No response';

  return NextResponse.json({ reply });
}
