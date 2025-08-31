//app/api/agents/[id]/route.ts:
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

    const { data, error } = await supabase
  .from("agents")
  .update({
    name: body.name,
    created_by: body.created_by,
    first_message: body.first_message,
    prompt: body.prompt,
    voice_id: body.voice_id,
    knowledge_base_ids: safeKnowledgeBaseIds,
  })
  .eq("agent_id", Number(id)) // convert to number if needed
  .select()
  .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

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
    .from("agents")
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

  return NextResponse.json({
    agent: {
      ...data,
      knowledge_base: {
        document_ids: data.knowledge_base_ids || [],
      },
    },
  });
}

