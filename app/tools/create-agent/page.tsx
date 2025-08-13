'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import NotificationPopup from '@/components/NotificationPopup';
import dynamic from 'next/dynamic';

// Dynamically import Conversation component, disable SSR (same as cons/page.tsx)
const Conversation = dynamic(
  () => import('@/components/conversation').then(mod => mod.Conversation),
  { ssr: false }
);

type Agent = {
  agent_id: string;
  name: string;
  created_by: string;
  created_at: string;
  prompt?: string; // add prompt to type to pass it to Conversation
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');

  // New state for showing conversation modal
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      setAgents(data.agents || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!agentName || !createdBy || !firstMessage || !systemPrompt) {
      alert('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          created_by: createdBy,
          first_message: firstMessage,
          prompt: systemPrompt,
          model: 'eleven-multilingual-v1',
          temperature: 0.7,
          language: 'en',
          voice_id: selectedVoiceId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create agent');
      }

      const newAgent = await res.json();

      // Add prompt to newAgent so we can pass it to conversation
      newAgent.prompt = systemPrompt;

      // Add new agent to list immediately
      setAgents((prev) => [newAgent, ...prev]);

      setAgentName('');
      setCreatedBy('');
      setFirstMessage('');
      setSystemPrompt('');
      setShowPopup(false);
      setShowNotification(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    setAgentName('');
    setCreatedBy('');
    setFirstMessage('');
    setSystemPrompt('');
    setShowPopup(false);
  };

  // Open conversation modal for selected agent
  const openConversation = (agent: Agent) => {
    setActiveAgent(agent);
  };

  // Close conversation modal
  const closeConversation = () => {
    setActiveAgent(null);
  };
  const deleteAgent = async (agent_id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this agent?");
    if (!confirmDelete) return;
  
    try {
      // 1. Delete from Supabase
      const { error: supabaseError } = await supabase
        .from("agents")
        .delete()
        .eq("agent_id", agent_id);
  
      if (supabaseError) {
        console.error("Supabase delete error:", supabaseError);
        alert("Failed to delete from database.");
        return;
      }
  
      // 2. Delete from ElevenLabs
      const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/agents/${agent_id}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY || ''
        }
      });
  
      if (!elevenLabsRes.ok) {
        console.error("ElevenLabs delete failed:", await elevenLabsRes.text());
        alert("Deleted from DB but failed to delete from ElevenLabs.");
      }
  
      // 3. Remove from UI state
      setAgents(prevAgents => prevAgents.filter(agent => agent.agent_id !== agent_id));
  
      alert("Agent deleted successfully.");
    } catch (err) {
      console.error("Error deleting agent:", err);
      alert("Something went wrong.");
    }
  };
  
  return (
    <div className="min-h-screen p-6 bg-black-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button
          onClick={() => setShowPopup(true)}
          className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Agent
        </button>
      </div>

      <table className="min-w-full bg-black rounded shadow-md">
        <thead className="bg-black-200 text-white-500">
          <tr>
            <th className="text-left py-2 px-4">Agent Name</th>
            <th className="text-left py-2 px-4">Created By</th>
            <th className="text-left py-2 px-4">Created At</th>
            <th className="text-left py-2 px-4">Action</th> {/* New Action column */}
            
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.agent_id} className="border-t">
              <td className="py-2 px-4">{agent.name}</td>
              <td className="py-2 px-4">{agent.created_by}</td>
              <td className="py-2 px-4">
              {format(new Date(agent.created_at), 'dd/MM/yyyy HH:mm')}
              </td>
              <td className="py-2 px-1">
  <div className="flex items-center gap-2">
    <button
      onClick={() => openConversation(agent)}
      className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded hover:bg-green-700"
    >
      Chat
    </button>

    <button
      onClick={() => deleteAgent(agent.agent_id)}
      className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
    >
      🗑
    </button>
  </div>
</td>

            </tr>
          ))}
        </tbody>
      </table>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Agent</h2>

            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Agent Name"
                className="w-full border border-gray-300 p-2 mb-3 rounded"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Created By"
                className="w-full border border-gray-300 p-2 mb-3 rounded"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
              />

              <textarea
                placeholder="First Message"
                className="w-full border border-gray-300 p-2 mb-3 rounded"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
              />

              <textarea
                placeholder="System Prompt"
                className="w-full border border-gray-300 p-2 mb-3 rounded"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />

              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full border border-gray-300 p-2 mb-3 rounded text-gray-400"
                required
              >
                <option value="">Select a voice</option>
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
                <option value="AZnzlk1XvdvUeBnXmlld">Domi</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni</option>
                <option value="MF3mGyEYCl7XYWbV9V6O">Elli</option>
              </select>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Decline
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conversation Modal */}
      {activeAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-3xl h-[90vh] relative">
            <button
              onClick={closeConversation}
              className="absolute top-4 right-4 text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 z-50"
            >
              Close
            </button>

            {/* Pass agent_id and prompt to Conversation component */}
            <Conversation agentId={activeAgent.agent_id} agentName={activeAgent.name}/>
          </div>
        </div>
      )}

      <NotificationPopup
        show={showNotification}
        agentName={agentName}
        onClose={() => setShowNotification(false)}
        onDecline={() => setShowNotification(false)}
      />
    </div>
  );
}
