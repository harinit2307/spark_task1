//app/components/CallAgent.tsx
"use client";

import { useState, useEffect } from "react";

export default function CallAgent() {
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [status, setStatus] = useState("");

  // Fetch agents from your /api/agents route
  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents || []);
    };
    fetchAgents();
  }, []);

  const startCall = async () => {
    setStatus("📞 Calling...");
    const res = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, phone_number: phoneNumber }),
    });

    const data = await res.json();
    if (res.ok) {
      setStatus(`✅ Call started: ${JSON.stringify(data)}`);
    } else {
      setStatus(`❌ Error: ${data.error}`);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">Call an Agent</h2>

      <select
        className="border p-2 mb-2 w-full"
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
      >
        <option value="">Select Agent</option>
        {agents.map((a) => (
          <option key={a.agent_id} value={a.agent_id}>
            {a.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        className="border p-2 mb-2 w-full"
        placeholder="Imported Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={startCall}
        disabled={!agentId || !phoneNumber}
      >
        Start Call
      </button>

      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}
