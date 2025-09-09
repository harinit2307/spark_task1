// app/api/agents/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const AGENTS_TABLE = "agents";

// PUT: Update an agent
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // ✅ take from URL
    const body = await req.json();

    // Ensure knowledge_base_ids is always an array
    const safeKnowledgeBaseIds = body.knowledge_base?.document_ids || [];

    // Update in Supabase
    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .update({
        name: body.name,
        created_by: body.created_by,
        first_message: body.first_message,
        prompt: body.prompt,
        voice_id: body.voice_id,
        knowledge_base_ids: safeKnowledgeBaseIds,
      })
      .eq("agent_id", id) // make sure `agent_id` is unique in table
      .select()
      .maybeSingle(); // ✅ safer than .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Update in ElevenLabs too
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "Missing ELEVENLABS_API_KEY" },
        { status: 500 }
      );
    }

    const elevenPayload = {
      name: body.name,
      conversation_config: {
        agent: {
          first_message: body.first_message,
          prompt: {
            prompt: body.prompt,
            llm: {
              model: body.model || "eleven-multilingual-v1",
              temperature: body.temperature ?? 0.7,
            },
          },
          language: body.language || "en",
          knowledge_base: { document_ids: safeKnowledgeBaseIds },
        },
      },
    };

    await fetch(`https://api.elevenlabs.io/v1/convai/agents/${id}`, {
      method: "PATCH",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(elevenPayload),
    });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabase
    .from(AGENTS_TABLE)
    .select("*")
    .eq("agent_id", id)
    .maybeSingle(); // ✅ safe lookup

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent", details: error.message },
      { status: 500 }
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ...data,
      knowledge_base: {
        document_ids: data.knowledge_base_ids || [],
      },
    },
    { status: 200 }
  );
}
