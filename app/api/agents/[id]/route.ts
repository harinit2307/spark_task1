// File: app/api/agents/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type KnowledgeBase = {
  document_ids: string[];
};

interface ElevenLabsPayload {
  name?: string;
  conversation_config?: {
    agent: {
      prompt: {
        prompt: string;
        knowledge_base?: Array<{
          type: string;
          id: string;
          name: string;
          usage_mode?: string;
        }>;
      };
    };
  };
  platform_settings?: {
    overrides?: {
      conversation_config_override?: {
        agent?: {
          first_message?: boolean;
          language?: boolean;
          prompt?: { prompt?: boolean };
        };
        conversation?: { text_only?: boolean };
        tts?: { voice_id?: boolean };
      };
    };
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const AGENTS_TABLE = "agents";

export async function PUT(
  req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  console.log("🔹 Incoming agent ID:", id);

  try {
    const {
      name,
      first_message,
      prompt: systemPrompt,
      voice_id,
      documentIds,
      overrideConfig, // NEW - extra config for overrides
    } = await req.json();

    console.log("🔹 PUT /agents called with body:", {
      name,
      first_message,
      systemPrompt,
      voice_id,
      documentIds,
      overrideConfig,
    });

    // ----------------------------
    // 1️⃣ Build ElevenLabs Payload
    // ----------------------------

let elevenData = null;
if (process.env.ELEVENLABS_API_KEY) {
  const elevenLabsPayload: any = {};

  // Add name if present
  if (name) elevenLabsPayload.name = name;

  // ✅ Always build conversation_config.agent
  elevenLabsPayload.conversation_config = {
    agent: {
      ...(first_message ? { first_message } : {}), // put first_message here ✅
      prompt: {
        prompt: systemPrompt || "",
        ...(documentIds && documentIds.length > 0
          ? {
              knowledge_base: documentIds.map((docId: string) => ({
                type: "file",
                id: docId,
                name: `Document ${docId.substring(0, 8)}`,
                usage_mode: "prompt",
              })),
            }
          : {}),
      },
    },
  };

  // Add overrideConfig if provided
  if (overrideConfig) {
    elevenLabsPayload.platform_settings = {
      overrides: {
        conversation_config_override: overrideConfig,
      },
    };
  }

  console.log("⚡ Sending PATCH to ElevenLabs with payload:", elevenLabsPayload);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${id}`, // id must be ElevenLabs agent id
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify(elevenLabsPayload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.detail?.message || "Failed to update agent in ElevenLabs"
      );
    }

    elevenData = await response.json();
    console.log("✅ ElevenLabs update successful:", elevenData);
  } catch (error) {
    console.error("❌ ElevenLabs update failed:", error);
    return NextResponse.json(
      {
        error: "Failed to update agent in ElevenLabs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
} else {
  console.warn("⚠ ELEVENLABS_API_KEY not set, skipping ElevenLabs update");
}


    // ----------------------------
    // 2️⃣ Update Supabase
    // ----------------------------
    const { data: updated, error: dbError } = await supabase
      .from(AGENTS_TABLE)
      .update({
        name,
        first_message,
        prompt: systemPrompt,
        voice_id,
        knowledge_base_ids: documentIds || [],
      })
      .eq("agent_id", id) // use agent_id (text column)
      .select();

    console.log("🔹 Supabase update result:", { updated, dbError });

    if (dbError) {
      console.error("❌ Supabase update failed:", dbError);
      return NextResponse.json(
        { error: "Supabase update failed", details: dbError },
        { status: 500 }
      );
    }

    if (!updated || updated.length === 0) {
      console.warn(
        "⚠ Supabase update returned empty result. Check if id column is correct!"
      );
    }

    // ----------------------------
    // 3️⃣ Return merged response
    // ----------------------------
    return NextResponse.json(
      {
        message: "✅ Agent updated successfully in ElevenLabs + Supabase",
        supabase: updated?.[0],
        eleven: elevenData,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ PUT error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


/**
 * GET: Fetch single agent
 */
export async function GET(
  _req: Request,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json({ error: "Agent ID is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from(AGENTS_TABLE)
      .select("*")
      .eq("agent_id", id.trim())
      .single();

    if (error) {
      console.error("Supabase single fetch error:", error);
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
        knowledge_base: { document_ids: data.knowledge_base_ids || [] },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}
