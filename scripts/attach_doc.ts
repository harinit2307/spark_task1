// scripts/attach_doc.ts

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("❌ Missing ELEVENLABS_API_KEY environment variable.");
  process.exit(1);
}

const [,, agentId, docId] = process.argv;
if (!agentId || !docId) {
  console.error("Usage: tsx scripts/attach_doc.ts <AGENT_ID> <DOC_ID>");
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: "PATCH",
      headers: {
        "xi-api-key": KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        knowledge_base: {
          enabled: true,
          document_ids: [docId],
        },
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("❌ ElevenLabs API error:", res.status, text);
      process.exit(1);
    }

    console.log("✅ Agent updated successfully!");
    console.log(text);
  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
})();
