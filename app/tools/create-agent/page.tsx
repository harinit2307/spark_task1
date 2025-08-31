'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import NotificationPopup from '@/components/NotificationPopup';
import dynamic from 'next/dynamic';
import { MessageCircle, Trash2, Pencil } from 'lucide-react';
import { useRouter, useSearchParams } from "next/navigation";

const Conversation = dynamic(
  () => import('@/components/conversation').then((mod) => mod.Conversation),
  { ssr: false }
);

type Agent = {
  agent_id: string;
  name: string;
  created_by: string;
  created_at: string;
  first_message?: string;
  prompt?: string;
  voice_id?: string;
  knowledge_base?: {
    document_ids: string[];
  };
};


interface DocumentItem {
  id: string;
  name: string;
  type: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const [agentName, setAgentName] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();
const searchParams = useSearchParams();


  // Knowledge base
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [editAgentId, setEditAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
    fetchDocuments();
  }, []);
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && agents.length > 0) {
      const agent = agents.find((a) => a.agent_id === editId);
      if (agent) {
        openEdit(agent);
      }
    }
  }, [searchParams, agents]);

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

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/knowledge-base');
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  // ----------------- CREATE -----------------
  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!agentName || !createdBy || !firstMessage || (!useKnowledgeBase && !systemPrompt)) {
      alert('Please fill in all fields.');
      return;
    }
    
    

    setLoading(true);
    try {
      const payload: any = {
        name: agentName,
        created_by: createdBy,
        first_message: firstMessage,
        prompt: systemPrompt,
        model: 'eleven-multilingual-v1',
        temperature: 0.7,
        language: 'en',
        voice_id: selectedVoiceId
      };

      if (useKnowledgeBase && selectedDocuments.length > 0) {
        payload.knowledge_base = { document_ids: selectedDocuments };
      }

      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create agent');
      }

      const newAgent = await res.json();
      newAgent.prompt = systemPrompt;
      setAgents((prev) => [newAgent, ...prev]);

      resetForm();
      setShowPopup(false);
      setShowNotification(true);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------- UPDATE -----------------
  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editAgentId) return;

    setLoading(true);
    try {
      const payload: any = {
        name: agentName,
        created_by: createdBy,
        first_message: firstMessage,
        prompt: systemPrompt,
        voice_id: selectedVoiceId
      };

      if (useKnowledgeBase && selectedDocuments.length > 0) {
        payload.knowledge_base = { document_ids: selectedDocuments };
      }

      const res = await fetch(`/api/agents/${editAgentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update agent');
      }

      const updatedAgent = await res.json();

      setAgents((prev) =>
        prev.map((a) => (a.agent_id === editAgentId ? { ...a, ...updatedAgent } : a))
      );

      resetForm();
      setShowPopup(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAgentName('');
    setCreatedBy('');
    setFirstMessage('');
    setSystemPrompt('');
    setSelectedVoiceId('');
    setUseKnowledgeBase(false);
    setSelectedDocuments([]);
    setEditAgentId(null);
    setMode('create');
  };

  const handleDecline = () => {
    resetForm();
    setShowPopup(false);
  };

  const openConversation = (agent: Agent) => setActiveAgent(agent);
  const closeConversation = () => setActiveAgent(null);

  const openEdit = (agent: Agent) => {
    setAgentName(agent.name);
    setCreatedBy(agent.created_by);
    setFirstMessage(agent.first_message || "");
    setSystemPrompt(agent.prompt || "");
    setSelectedVoiceId(agent.voice_id || "");
    setEditAgentId(agent.agent_id);
  
    // ✅ Handle knowledge base docs
    if (agent.knowledge_base && agent.knowledge_base.document_ids?.length > 0) {
      setUseKnowledgeBase(true);
      setSelectedDocuments(agent.knowledge_base.document_ids);
    } else {
      setUseKnowledgeBase(false);
      setSelectedDocuments([]);
    }
  
    setMode("edit");
    setShowPopup(true);
  
    // ✅ Clean URL so ?edit=id disappears
    router.replace("/tools/create-agent", { scroll: false });
  };
  
  
  const deleteAgent = async (agent_id: string) => {
    if (!window.confirm('Are you sure you want to delete this agent?')) return;
    try {
      const { error: supabaseError } = await supabase
        .from('agents')
        .delete()
        .eq('agent_id', agent_id);
      if (supabaseError) {
        alert('Failed to delete from database.');
        return;
      }

      const elevenLabsRes = await fetch(`https://api.elevenlabs.io/v1/agents/${agent_id}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || ''
        }
      });

      if (!elevenLabsRes.ok) {
        alert('Deleted from DB but failed to delete from ElevenLabs.');
      }

      setAgents((prev) => prev.filter((a) => a.agent_id !== agent_id));
      alert('Agent deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Something went wrong.');
    }
  };

  const handleDocumentSelection = (docId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  return (
    <div className="min-h-screen p-6 bg-black text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agents</h1>
        <button
          onClick={() => {
            resetForm();
            setMode('create');
            setShowPopup(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2 rounded-full shadow-lg hover:scale-105 transition"
        >
          + Create Agent
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg bg-[#0b0b1f] border border-purple-500/30">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-purple-900/40 text-gray-200">
            <tr>
              <th className="py-3 px-4">Agent Name</th>
              <th className="py-3 px-4">Created By</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr
                key={agent.agent_id}
                className="border-t border-white/10 hover:bg-purple-900/30 transition"
              >
                <td className="py-3 px-4">{agent.name}</td>
                <td className="py-3 px-4">{agent.created_by}</td>
                <td className="py-3 px-4">
                  {format(new Date(agent.created_at), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openConversation(agent)}
                      className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-110 shadow-md transition"
                      title="Chat"
                    >
                      <MessageCircle size={18} className="text-white" />
                    </button>
                    <button
                      onClick={() => openEdit(agent)}
                      className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-110 shadow-md transition"
                      title="Edit"
                    >
                      <Pencil size={18} className="text-white" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.agent_id)}
                      className="p-2 rounded-full bg-gradient-to-r from-[#5a1a3c] to-[#a32d6e] hover:scale-110 hover:shadow-[0_0_10px_#a32d6e] transition"
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-white" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f2d] p-6 rounded-lg shadow-lg w-full max-w-md border border-purple-500/30 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {mode === 'create' ? 'Create New Agent' : 'Edit Agent'}
            </h2>
            <form onSubmit={mode === 'create' ? handleCreate : handleUpdate}>
              <input
                type="text"
                placeholder="Agent Name"
                className="w-full bg-black/20 border border-purple-500/30 p-2 mb-3 rounded text-white"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Created By"
                className="w-full bg-black/20 border border-purple-500/30 p-2 mb-3 rounded text-white"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
              />
              <textarea
                placeholder="First Message"
                className="w-full bg-black/20 border border-purple-500/30 p-2 mb-3 rounded text-white"
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
              />
              {!useKnowledgeBase && (
                <div className="mb-3">
                  <label className="block mb-1 text-sm text-gray-300">System Prompt</label>
                  <textarea
                    className="w-full p-2 rounded bg-black/20 text-gray-100"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter system prompt..."
                  />
                </div>
              )}

              <select
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className="w-full bg-black/20 border border-purple-500/30 p-2 mb-3 rounded text-gray-300"
                required
              >
                <option value="">Select a voice</option>
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel</option>
                <option value="AZnzlk1XvdvUeBnXmlld">Domi</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni</option>
                <option value="MF3mGyEYCl7XYWbV9V6O">Elli</option>
              </select>

              {/* Knowledge Base Option */}
              <div className="mb-3">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={useKnowledgeBase}
                    onChange={(e) => setUseKnowledgeBase(e.target.checked)}
                    className="rounded"
                  />
                  Use Knowledge Base
                </label>
              </div>

              {useKnowledgeBase && (
                <div className="mb-3 max-h-32 overflow-y-auto border border-purple-500/30 rounded p-2 bg-black/20">
                  <p className="text-sm text-gray-400 mb-2">Select documents:</p>
                  {documents.length === 0 ? (
                    <p className="text-sm text-gray-500">No documents available</p>
                  ) : (
                    documents.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-2 text-sm mb-1 text-gray-300"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={() => handleDocumentSelection(doc.id)}
                          className="rounded"
                        />
                        {doc.name} ({doc.type})
                      </label>
                    ))
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
                >
                  Decline
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 px-4 py-2 rounded text-white"
                  disabled={loading}
                >
                  {loading ? (mode === 'create' ? 'Creating...' : 'Updating...') : mode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeAgent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-3xl h-[90vh] relative">
            <button
              onClick={closeConversation}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center 
             rounded-full bg-red-500 text-white font-bold hover:bg-red-700"
            >
              ×
            </button>
            <Conversation
              agentId={activeAgent.agent_id}
              agentName={activeAgent.name}
              onClose={closeConversation}
            />
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
