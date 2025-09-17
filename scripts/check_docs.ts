// scripts/check_docs.ts
// Usage (PowerShell):
// $env:ELEVENLABS_API_KEY="sk_..."
// npx tsx scripts/check_docs.ts               <-- list docs
// npx tsx scripts/check_docs.ts DOC_ID        <-- check a single doc id

export {}; // make this a module so `globalThis` cast works

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("Missing ELEVENLABS_API_KEY environment variable. Set it first.");
  process.exit(1);
}

const docToFind = process.argv[2];

(async () => {
  try {
    const fetchFn = (globalThis as any).fetch;
    if (!fetchFn) {
      console.error("No global fetch available. Please use Node 18+ or run with tsx.");
      process.exit(1);
    }

   const res = await fetchFn("https://api.elevenlabs.io/v1/convai/knowledge-base/document", {

      headers: { "xi-api-key": KEY },
      method: "GET",
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("ElevenLabs API error:", res.status, text);
      process.exit(1);
    }

    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    const docs = Array.isArray(data) ? data : (data.documents || data.items || []);
    console.log("Documents count:", Array.isArray(docs) ? docs.length : "unknown");

    // Print concise list (id + name + status) — limit to 100 items to avoid huge output
    const list = (docs || []).slice(0, 100).map((d: any) => ({
      id: d.document_id || d.id || d.documentId,
      name: d.name || d.title,
      status: d.status || null,
    }));
    console.log(list);

    if (docToFind) {
      const found = (docs || []).find((d: any) =>
        d.document_id === docToFind || d.id === docToFind || d.documentId === docToFind
      );
      if (found) {
        console.log("✅ Document found:", {
          id: found.document_id || found.id || found.documentId,
          name: found.name || found.title,
          status: found.status || null,
        });
      } else {
        console.log("❌ Document NOT found in ElevenLabs:", docToFind);
      }
    } else {
      console.log("Tip: re-run with a specific document id to check it:");
      console.log(' npx tsx scripts/check_docs.ts doc_yourid');
    }
  } catch (err) {
    console.error("Fetch error:", err);
    process.exit(1);
  }
})();
