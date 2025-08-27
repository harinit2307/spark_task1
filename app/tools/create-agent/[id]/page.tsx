"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CreateAgentPage() {
  const { id } = useParams(); // agent_id
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    created_by: "",
    first_message: "",
    prompt: "",
    voice_id: "",
    knowledge_base_ids: [] as string[],
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function fetchAgent() {
      try {
        const res = await fetch(`/api/agents/${id}`);
        const data = await res.json();
        if (res.ok && data.agent) {
          setForm({
            name: data.agent.name || "",
            created_by: data.agent.created_by || "",
            first_message: data.agent.first_message || "",
            prompt: data.agent.prompt || "",
            voice_id: data.agent.voice_id || "",
            knowledge_base_ids: data.agent.knowledge_base_ids || [],
          });
        }
      } catch (err) {
        console.error("Error fetching agent:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [id]);

  if (loading) return <div className="p-6">Loading agent...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        {id ? "Edit Agent" : "Create Agent"}
      </h1>

      <form className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Created By"
          value={form.created_by}
          onChange={(e) => setForm({ ...form, created_by: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        <textarea
          placeholder="First Message"
          value={form.first_message}
          onChange={(e) => setForm({ ...form, first_message: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        <textarea
          placeholder="Prompt"
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        <input
          type="text"
          placeholder="Voice ID"
          value={form.voice_id}
          onChange={(e) => setForm({ ...form, voice_id: e.target.value })}
          className="w-full p-2 rounded bg-gray-800 text-white"
        />
        {/* KB IDs display */}
        <div className="text-sm text-gray-400">
          KB Docs: {form.knowledge_base_ids.join(", ") || "None"}
        </div>
      </form>
    </div>
  );
}
