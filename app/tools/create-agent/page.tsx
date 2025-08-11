'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import NotificationPopup from '@/components/NotificationPopup';

type Agent = {
  agent_id: string;
  name: string;
  created_by: string;
  created_at: string;
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
  const [selectedVoiceId, setSelectedVoiceId] = useState(''); // Default to empty string or a default voice ID

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
    if (e) e.preventDefault(); // stop page reload

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
          first_message: firstMessage,
          prompt: systemPrompt,
          model: 'eleven-multilingual-v1',
          temperature: 0.7,
          language: 'en',
          voice_id: selectedVoiceId
        })
      })
      

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create agent');
      }

      const newAgent = await res.json();
      setAgents((prev) => [
        ...prev,
        {
          agent_id: newAgent.agent_id,
          name: newAgent.name,
          created_by: createdBy,
          created_at: new Date().toISOString(),
        },
      ]);

      // reset form
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

  return (
    <div className="min-h-screen p-6 bg-black-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Agents</h1>
        <button
          onClick={() => setShowPopup(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.agent_id} className="border-t">
              <td className="py-2 px-4">{agent.name}</td>
              <td className="py-2 px-4">{agent.created_by}</td>
              <td className="py-2 px-4">
                {format(new Date(agent.created_at), 'PPP p')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Popup */}
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
                className="w-full border border-gray-300 p-2 mb-3 rounded bg-white"
                required
              >
                <option value="">Select a voice</option>
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female, English)</option>
                <option value="AZnzlk1XvdvUeBnXmlld">Domi (Female, English)</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female, English)</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni (Male, English)</option>
                <option value="MF3mGyEYCl7XYWbV9V6O">Elli (Female, English)</option>
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

      {/* Notification */}
      <NotificationPopup
        show={showNotification}
        agentName={agentName}
        onClose={() => setShowNotification(false)}
        onDecline={() => setShowNotification(false)}
      />
    </div>
  );
}
