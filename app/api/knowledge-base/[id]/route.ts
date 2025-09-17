//app/api/knowledge-base/[id]/route.ts
import { NextResponse } from "next/server";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ GET: Fetch a document's raw content
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/knowledge-base/${id}/content`,
      {
        method: "GET",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY as string },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: "Failed to fetch document content", details: errorText },
        { status: res.status }
      );
    }

    const content = await res.text();
    return NextResponse.json({ id, content });
  } catch (err: any) {
    console.error("Error fetching document content:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// ✅ DELETE: Delete a document safely

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1️⃣ Check if this document is used by any agents
    const { data: agents, error: fetchError } = await supabase
      .from("agents")
      .select("agent_id, name")
      .contains("knowledge_base_ids", [id]);

    if (fetchError) {
      console.error("Supabase fetch agents error:", fetchError.message);
      return NextResponse.json(
        { success: false, error: fetchError.message },
        { status: 500 }
      );
    }

    // 2️⃣ If agents are using this doc → block deletion & ask for action
    if (agents?.length) {
      return NextResponse.json(
        {
          success: false,
          requires_action: true,
          message:
            "This document is in use by one or more agents. Please update or delete those agents first.",
          agents, // send back agent_id + name so frontend can show
        },
        { status: 409 } // Conflict
      );
    }

    // 3️⃣ Safe to delete from ElevenLabs KB
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/convai/knowledge-base/${id}?force=true`,
      {
        method: "DELETE",
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY as string },
      }
    );
    

    if (!elevenRes.ok) {
      const txt = await elevenRes.text();
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete in ElevenLabs",
          details: txt,
        },
        { status: elevenRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err: any) {
    console.error("Delete API error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
