import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("agent_id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch agent", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ agent: data });
}
