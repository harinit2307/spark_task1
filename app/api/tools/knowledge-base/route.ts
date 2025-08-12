// app/api/tools/knowledge-base/route.ts
import { NextResponse } from 'next/server';

/**
 * Required env variables:
 * - ELEVENLABS_API_KEY         -> your Eleven Labs API key
 * - ELEVENLABS_BASE_URL       -> optional, defaults to 'https://api.elevenlabs.io/v1/knowledge-base'
 */
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY ?? '';
const BASE_URL = process.env.ELEVENLABS_BASE_URL ?? 'https://api.elevenlabs.io/v1/knowledge-base';

// Small helper to build headers including API key
const defaultHeaders = () => ({ 'xi-api-key': ELEVENLABS_API_KEY });

/**
 * GET: fetch list of documents from Eleven Labs Knowledge Base
 */
export async function GET() {
  try {
    // Forward GET to Eleven Labs
    const res = await fetch(`${BASE_URL}/documents`, {
      method: 'GET',
      headers: defaultHeaders(),
    });

    // read JSON from Eleven Labs response and forward status
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    // on error, return 500 and message
    return NextResponse.json(
      { error: 'Failed to fetch documents from Eleven Labs', details: (err as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST: add a new document.
 * Supports:
 * - multipart/form-data with file field => forwarded to /documents/file
 * - JSON { type: 'url', content: 'https://...' } => forwarded to /documents/url
 * - JSON { type: 'text', content: '...' } => forwarded to /documents/text
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // --- Case 1: file upload (multipart/form-data) ---
    if (contentType.includes('multipart/form-data')) {
      // parse incoming form-data
      const incoming = await request.formData();
      const file = incoming.get('file'); // must be posted with field name "file"

      if (!file) {
        return NextResponse.json({ error: 'No file found. Use form field name "file".' }, { status: 400 });
      }

      // Build a FormData instance to forward to Eleven Labs
      const forward = new FormData();

      // file can be a Blob/File. We attempt to preserve filename if available.
      // TypeScript sometimes complains about "name", so we cast to any.
      // @ts-ignore
      const fileName = (file as any)?.name ?? 'upload.bin';
      forward.append('file', file as Blob, fileName);

      // Forward to Eleven Labs file endpoint. Do NOT set Content-Type header (boundary must be set automatically).
      const res = await fetch(`${BASE_URL}/documents/file`, {
        method: 'POST',
        headers: { ...defaultHeaders() }, // no content-type header
        body: forward as any, // forward FormData
      });

      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }

    // --- Case 2: JSON body for url or text ---
    const body = await request.json().catch(() => ({}));
    const { type, content } = body as { type?: string; content?: string };

    if (!type || !content || (type !== 'url' && type !== 'text')) {
      return NextResponse.json(
        {
          error:
            'Invalid request. For JSON use { type: "url" | "text", content: string }. For files use multipart/form-data with field "file".',
        },
        { status: 400 }
      );
    }

    // Choose endpoint based on type
    const endpoint = type === 'url' ? `${BASE_URL}/documents/url` : `${BASE_URL}/documents/text`;
    const payload = type === 'url' ? { url: content } : { text: content };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...defaultHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    // catch-all error
    return NextResponse.json({ error: 'Failed to POST to Eleven Labs', details: (err as Error).message }, { status: 500 });
  }
}

/**
 * DELETE: remove a document on Eleven Labs.
 * Expects JSON: { id: 'document-id' }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing document ID' }, { status: 400 });
    }

    // Forward DELETE to Eleven Labs
    const res = await fetch(`${BASE_URL}/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: defaultHeaders(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Failed to delete document', details: data }, { status: res.status });
    }

    // return success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to DELETE document', details: (err as Error).message }, { status: 500 });
  }
}