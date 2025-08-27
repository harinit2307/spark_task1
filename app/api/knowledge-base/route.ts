// app/api/knowledge-base/route.ts
import { NextResponse } from "next/server";

type RawDoc = {
  id: string;
  name?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  created_by?: string;
  createdBy?: string;
  uploaded_by?: string;
  uploader?: string;
};

// Normalizer with fallback
function normalizeDoc(d: RawDoc) {
  const created_at =
    d.created_at || d.createdAt || new Date().toISOString();
  const updated_at =
    d.updated_at || d.updatedAt || created_at;

  const created_by =
    d.created_by || d.createdBy || d.uploaded_by || d.uploader || "system";

  return {
    id: d.id,
    name: d.name ?? "Untitled",
    type: d.type ?? null,
    created_at,
    updated_at,
    created_by,
  };
}
async function getAccountHolderName() {
  const userRes = await fetch("https://api.elevenlabs.io/v1/user", {
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
    },
  });

  const text = await userRes.text();
  console.log("ELEVENLABS USER RAW RESPONSE:", text);

  if (!userRes.ok) {
    return "Unknown User";
  }

  try {
    const userData = JSON.parse(text);
    if (userData?.email) {
      return userData.email; // show full email
      // or userData.email.split("@")[0] if you want just prefix
    }
  } catch (err) {
    console.error("Error parsing /v1/user:", err);
  }

  return "Unknown User";
}




export async function GET() {
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/knowledge-base",
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        },
      }
    );

    const raw = await response.json();
    const list: RawDoc[] = Array.isArray(raw) ? raw : raw?.documents ?? [];

    // fetch ElevenLabs user info
    const accountHolder = await getAccountHolderName();

    const documents = list.map((doc) => {
      const normalized = normalizeDoc(doc);
      if (normalized.created_by === "system" || !normalized.created_by) {
        normalized.created_by = accountHolder;
      }
      return normalized;
    });

    documents.sort((a, b) => {
      const aTime = a.updated_at || a.created_at || "";
      const bTime = b.updated_at || b.created_at || "";
      return bTime.localeCompare(aTime);
    });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch docs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type");

    // Get account holder for created_by
    const accountHolder = await getAccountHolderName();

    if (contentType?.includes("application/json")) {
      const { text, url } = await req.json();
      let endpoint = "";
      let body: any = {};

      if (text) {
        endpoint = "/v1/convai/knowledge-base/text";
        body = { text };
      } else if (url) {
        try {
          new URL(url);
        } catch {
          return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
        }
        endpoint = "/v1/convai/knowledge-base/url";
        body = { url };
      } else {
        return NextResponse.json(
          { error: "Text or URL required" },
          { status: 400 }
        );
      }

      const response = await fetch(
        `${process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io"}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: err }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        created_by: accountHolder,
        created_at: new Date().toISOString(),
      });
    }

    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const uploadForm = new FormData();
      uploadForm.append("file", file, file.name);

      const response = await fetch(
        "https://api.elevenlabs.io/v1/convai/knowledge-base/file",
        {
          method: "POST",
          headers: {
            "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
          },
          body: uploadForm,
        }
      );

      if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: err }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        created_by: accountHolder,
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: "Unsupported content type" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
