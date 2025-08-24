import { NextResponse } from "next/server";

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

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Fetch docs error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type");

    // ✅ Handle JSON (text or url uploads)
    if (contentType?.includes("application/json")) {
      const { text, url } = await req.json();
      let endpoint = "";
      let body: any = {};

      if (text) {
        endpoint = "/v1/convai/knowledge-base/text";
        body = { text };
      } else if (url) {
        endpoint = "/v1/convai/knowledge-base/url";
        body = { url };
      } else {
        return NextResponse.json({ error: "Text or URL required" }, { status: 400 });
      }

      const response = await fetch(`${process.env.ELEVENLABS_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.text();
        return NextResponse.json({ error: err }, { status: response.status });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // ✅ Handle multipart form-data (file upload)
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;

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

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
