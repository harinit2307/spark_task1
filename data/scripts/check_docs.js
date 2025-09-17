// scripts/check_docs.js
// Usage: set env var and run: $env:ELEVENLABS_API_KEY="sk_..."; node scripts/check_docs.js [DOCUMENT_ID]

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("Missing ELEVENLABS_API_KEY environment variable. Set it first.");
  process.exit(1);
}

const docToFind = process.argv[2]; // optional

(async () => {
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/convai/knowledge-base/documents", {
      headers: { "xi-api-key": KEY },
      method: "GET",
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("ElevenLabs API returned error:", res.status, text);
      process.exit(1);
    }

    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    // Normalize documents array (APIs vary)
    const docs = Array.isArray(data) ? data : (data?.documents || data?.items || []);
    console.log("Documents count:", docs.length ?? 0);

    // Print brief list (id + name) - trim if many
    console.log(docs.slice(0, 50).map(d => ({
      id: d.document_id || d.id || d.documentId,
      name: d.name || d.title || null,
      status: d.status || null
    })));

    if (docToFind) {
      const found = docs.find(d =>
        (d.document_id && d.document_id === docToFind) ||
        (d.id && d.id === docToFind) ||
        (d.documentId && d.documentId === docToFind)
      );
      if (found) {
        console.log("✅ Document found:", found);
      } else {
        console.log("❌ Document NOT found in ElevenLabs:", docToFind);
      }
    } else {
      console.log("Tip: re-run with a document id to check a single doc:");
      console.log('  $env:ELEVENLABS_API_KEY="sk_..."; node scripts/check_docs.js YOUR_DOC_ID');
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
})();
