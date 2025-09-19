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
    const numbers = phoneNumber.split(",").map((n) =>
      n.trim().replace(/\s+/g, "")
    );
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
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[#111] text-white">
      {/* Page Header */}
      <div className="w-full max-w-3xl text-center mb-10">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Text to Speech
        </h1>
        <p className="text-gray-400 mt-2">
          Generate speech from your text using ElevenLabs-style UI
        </p>
      </div>

      {/* Call Agent Box */}
      <div className="w-full max-w-3xl p-8 border border-gray-700 rounded-2xl shadow-lg bg-gray-900">
        <h2 className="text-2xl font-bold mb-6 text-white">📞 Call an Agent</h2>

        <select
          className="w-full p-3 mb-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
          className="w-full p-3 mb-4 rounded-lg bg-gray-800 text-white border border-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter phone numbers (comma separated)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <button
          className={`w-full px-6 py-3 rounded-lg text-white font-medium transition-all 
            bg-gradient-to-r from-pink-500 to-purple-600 
            ${
              !agentId || !phoneNumber
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90"
            }
          `}
          onClick={startCall}
          disabled={!agentId || !phoneNumber}
        >
          Start Call
        </button>

        {status && (
          <p className="mt-4 text-sm text-gray-300 text-center">{status}</p>
        )}
      </div>
    </div>
  );
}
