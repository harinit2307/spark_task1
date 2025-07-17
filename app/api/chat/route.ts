import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message } = await req.json();

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json({ error: 'Unable to get response from OpenAI.' }, { status: 500 });
    }

    const data = await openaiRes.json();
    console.log('Response from OpenAI:', JSON.stringify(data, null, 2));

    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('OpenAI response missing expected format:', data);
      return NextResponse.json({ error: 'No valid reply from OpenAI.' }, { status: 500 });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Unexpected server error:', error);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
