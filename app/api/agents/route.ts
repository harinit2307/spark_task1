//app/api/agents/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AGENTS_TABLE = 'agents';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ GET: Fetch all agents
export async function GET() {
  try {
    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    return NextResponse.json({ agents: data || [] });
  } catch (err) {
    console.error('Internal GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ POST: Create a new agent
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.created_by) {
      return NextResponse.json({ error: 'Missing name or created_by' }, { status: 400 });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json({ error: 'Missing ELEVENLABS_API_KEY' }, { status: 500 });
    }

    // Create agent in ElevenLabs
    const payload: any = {
      name: body.name,
      voice: { voice_id: body.voice_id || 'EXAVITQu4vr4xnSDxMaL' },
      conversation_config: {
        agent: {
          first_message: body.first_message,
          prompt: {
            prompt: body.prompt,
            llm: { model: body.model || 'eleven-multilingual-v1', temperature: body.temperature ?? 0.7 }
          },
          language: body.language || 'en',
          ...(body.knowledge_base ? { knowledge_base: { document_ids: body.knowledge_base.document_ids } } : {}),
        },
        tts: { audio_format: { format: 'pcm', sample_rate: 16000 } },
      },
    };

    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error('ElevenLabs create failed:', text);
      return NextResponse.json({ error: 'ElevenLabs API failed', details: text }, { status: response.status });
    }

    const data = JSON.parse(text);

    // ⚡ Store ElevenLabs agent_id and knowledge base usage
    const { error: dbError } = await supabase.from(AGENTS_TABLE).insert([
      {
        agent_id: data.agent_id,
        name: body.name,
        created_by: body.created_by,
        first_message: body.first_message,
        prompt: body.prompt,
        voice_id: body.voice_id,
        knowledge_base_ids: body.knowledge_base?.document_ids || [], // ✅ store KB usage
        created_at: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return NextResponse.json({ error: 'Agent created but DB insert failed' }, { status: 500 });
    }

    return NextResponse.json({
      agent_id: data.agent_id,
      name: body.name,
      created_by: body.created_by,
      first_message: body.first_message,
      prompt: body.prompt,
      voice_id: body.voice_id,
      knowledge_base_ids: body.knowledge_base?.document_ids || [],
      created_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Internal POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ✅ DELETE: Delete agent safely
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agent_id = searchParams.get('agent_id');

    if (!agent_id) return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) return NextResponse.json({ error: 'Missing ELEVENLABS_API_KEY' }, { status: 500 });

    console.log('Deleting agent in ElevenLabs with id:', agent_id);

    const deleteResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent_id}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY },
    });

    const text = await deleteResponse.text();
    console.log('ElevenLabs delete status:', deleteResponse.status, 'body:', text);

    if (!deleteResponse.ok) {
      return NextResponse.json({ error: 'Failed to delete agent in ElevenLabs', details: text }, { status: deleteResponse.status });
    }

    // Delete from Supabase
    const { error: dbError } = await supabase.from(AGENTS_TABLE).delete().eq('agent_id', agent_id);
    if (dbError) {
      console.error('Supabase deletion error:', dbError);
      return NextResponse.json({ error: 'Agent deleted in ElevenLabs but failed in Supabase', details: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Agent deleted successfully in both ElevenLabs and Supabase' });

  } catch (err) {
    console.error('DELETE handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
