// app/components/CallAgent.tsx
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
    const numbers = phoneNumber.split(",").map(n => n.trim().replace(/\s+/g, ""));
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
    <div className="p-6 border border-gray-700 rounded-lg shadow bg-gray-900">
      <h2 className="text-xl font-bold mb-4 text-white">Call an Agent</h2>

      <select
        className="w-full p-2 mb-3 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
  className="w-full p-2 mb-3 rounded bg-gray-800 text-white border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
  placeholder="Enter phone numbers (comma separated)"
  value={phoneNumber}
  onChange={(e) => setPhoneNumber(e.target.value)}
/>


      <button
        className={`w-full px-4 py-2 rounded text-white font-medium transition-all ${
          !agentId || !phoneNumber
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90"
        }`}
        onClick={startCall}
        disabled={!agentId || !phoneNumber}
      >
        Start Call
      </button>

      {status && (
        <p className="mt-3 text-sm text-gray-300 text-center">{status}</p>
      )}
    </div>
  );
}
