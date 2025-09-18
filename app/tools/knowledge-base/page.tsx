// app/tools/knowledge-base/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Document = {
  id: string;
  name: string;
  type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function KnowledgeBasePage() {
  const [mode, setMode] = useState<"text" | "url" | "file">("text");
  const [text, setText] = useState("");
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(false);
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [conflictData, setConflictData] = useState<any | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // delete confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentName, setAgentName] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');

  const handleEditAgentWithDoc = (doc: Document) => {
    // Prefill agent popup with this document
    setShowPopup(true); // Open agent creation modal
    setUseKnowledgeBase(true); // Enable KB toggle
    setSelectedDoc(doc.id); // Select this document
  
    // Optional: you can also prefill agent name or prompt if you have a mapping
    const agentUsingDoc = agents.find(a => a.knowledge_base_ids?.includes(doc.id));
    if (agentUsingDoc) {
      setAgentName(agentUsingDoc.name);
      setCreatedBy(agentUsingDoc.created_by);
      setFirstMessage(agentUsingDoc.first_message || '');
      setSystemPrompt(agentUsingDoc.prompt || '');
      setSelectedVoiceId(agentUsingDoc.voice_id || '');
    } else {
      // Reset fields if no agent is using this doc
      setAgentName('');
      setCreatedBy('');
      setFirstMessage('');
      setSystemPrompt('');
      setSelectedVoiceId('');
    }
  };

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : data?.agents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  async function fetchDocuments() {
    try {
      const res = await fetch("/api/knowledge-base");
      const data = await res.json();
      const list: Document[] = Array.isArray(data) ? data : data?.documents || [];
      setDocuments(list);
    } catch {
      setDocuments([]);
    }
  }

  async function fetchDocumentDetails(id: string) {
    try {
      const res = await fetch(`/api/knowledge-base/${id}`);
      const data = await res.json();
      setSelectedDoc(data);
      setModalOpen(true);
    } catch {
      setSelectedDoc(null);
    }
  }

  async function confirmDelete() {
    if (!docToDelete) return;
    try {
      const res = await fetch(`/api/knowledge-base/${docToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
  
      if (res.ok) {
        setMessage("✅ Document deleted");
        await fetchDocuments();
      } else if (data?.requires_action) {
        // 🚨 Doc is in use by agents
        setConflictData(data); // open special modal
      } else {
        setMessage(`❌ Delete failed: ${data?.error || "Unknown error"}`);
      }
    } catch (e: any) {
      setMessage(`❌ Delete failed: ${e?.message || "Unknown error"}`);
    } finally {
      setConfirmOpen(false);
      setDocToDelete(null);
    }
  }
  
  

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let res: Response | undefined;

      if (mode === "text") {
        res = await fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      } else if (mode === "url") {
        res = await fetch("/api/knowledge-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } else if (mode === "file" && file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/knowledge-base", {
          method: "POST",
          body: formData,
        });
      }

      const data = await res?.json();
      if (res?.ok && data?.success) {
        setMessage("✅ Knowledge base updated successfully");
        setText("");
        setUrl("");
        setFile(null);
        fetchDocuments();
      } else {
        setMessage(`❌ Upload failed: ${data?.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setMessage(`❌ Upload failed: ${err?.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  const router = useRouter();

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Knowledge Base</h1>

      {/* Upload mode toggle */}
      <div className="flex space-x-4 mb-4">
        {(["text", "url", "file"] as const).map((btn) => (
          <button
            key={btn}
            onClick={() => setMode(btn)}
            className={`px-4 py-2 rounded-md text-white transition ${
              mode === btn
                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {btn.charAt(0).toUpperCase() + btn.slice(1)}
          </button>
        ))}
      </div>
      {conflictData && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
    <div className="bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-700 max-w-md w-full">
      <h3 className="text-lg font-semibold text-white mb-4">
        Cannot Delete Document
      </h3>
      <p className="text-gray-300 mb-4">{conflictData.message}</p>

      <ul className="mb-4 text-gray-400 space-y-2">
        {conflictData.agents?.map((a: any) => (
          <li
            key={a.agent_id}
            className="flex items-center justify-between bg-gray-800 p-2 rounded"
          >
            <span>{a.name || a.agent_id}</span>
            <div className="flex gap-2">
              {/* Edit Agent */}
              <button
                onClick={() =>
                  router.push(`/tools/create-agent?edit=${a.agent_id}`)
                }
                className="px-3 py-1 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white"
              >
                Edit
              </button>

              {/* Delete Agent */}
              <button
                onClick={async () => {
                  if (
                    !confirm(`Are you sure you want to delete agent: ${a.name}?`)
                  )
                    return;

                  try {
                    const res = await fetch(
                      `/api/agents?agent_id=${a.agent_id}`,
                      { method: "DELETE" }
                    );
                    const result = await res.json();

                    if (res.ok) {
                      alert(`✅ Deleted agent: ${a.name}`);
                      // Refresh agents in modal
                      const remaining = conflictData.agents.filter(
                        (ag: any) => ag.agent_id !== a.agent_id
                      );
                      if (remaining.length === 0) {
                        // If no agents left, retry deleting the document automatically
                        await fetch(
                          `/api/knowledge-base/${docToDelete?.id}`,
                          { method: "DELETE" }
                        );
                        await fetchDocuments();
                        setConflictData(null);
                        setMessage("✅ Document deleted (after removing agents)");
                      } else {
                        setConflictData({
                          ...conflictData,
                          agents: remaining,
                        });
                      }
                    } else {
                      alert(
                        `❌ Failed to delete ${a.name}: ${
                          result.error || "Unknown error"
                        }`
                      );
                    }
                  } catch (err: any) {
                    alert(
                      `❌ Error deleting ${a.name}: ${
                        err.message || "Unknown error"
                      }`
                    );
                  }
                }}
                className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-500 text-white"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setConflictData(null)}
          className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}


      {/* Upload form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "text" && (
          <textarea
            className="w-full p-3 border rounded-md bg-gray-800 text-white"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter knowledge base text..."
          />
        )}

        {mode === "url" && (
          <input
            type="url"
            className="w-full p-3 border rounded-md bg-gray-800 text-white"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a webpage URL..."
          />
        )}

        {mode === "file" && (
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-white"
          />
        )}

        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-md hover:opacity-90"
          disabled={loading}
        >
          {loading
            ? "Uploading..."
            : mode === "text"
            ? "Add Text"
            : mode === "url"
            ? "Add URL"
            : "Add File"}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-3 rounded-md bg-gray-800 border border-gray-700 text-sm">
          {message}
        </div>
      )}

      {/* Documents list */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Uploaded Documents</h2>

      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-700">
        {/* Table header */}
        <div className="grid grid-cols-4 font-semibold bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-3">
          <div>Name</div>
          <div>Created By</div>
          <div>Last Updated</div>
          <div className="text-right pr-2">Actions</div>
        </div>

        {/* Rows */}
        {documents.length === 0 ? (
          <div className="px-4 py-4 text-gray-400">No documents yet</div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="grid grid-cols-4 px-4 py-3 border-t border-gray-800 hover:bg-purple-900/20 transition"
            >
              <button
                className="text-left truncate hover:underline"
                onClick={() => fetchDocumentDetails(doc.id)}
                title={doc.name}
              >
                {doc.name || "Untitled"}
              </button>

              <div>{doc.created_by || "—"}</div>

              <div>
                {formatDate(doc.updated_at) !== "—"
                  ? formatDate(doc.updated_at)
                  : formatDate(doc.created_at)}
              </div>

              <div className="text-right space-x-2">
                <button
                  onClick={() => fetchDocumentDetails(doc.id)}
                  className="px-2 py-1 text-sm rounded bg-gray-700 hover:bg-gray-600"
                >
                  View
                </button>
                <button
                  onClick={() => {
                    setDocToDelete(doc);
                    setConfirmOpen(true);
                  }}
                  className="px-2 py-1 text-sm rounded bg-red-600 hover:bg-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal popup for viewing doc */}
      {modalOpen && selectedDoc && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60">
    <div className="bg-gray-900 w-2/3 rounded-lg p-6 shadow-lg relative max-h-[80vh] overflow-y-auto border border-gray-700">
      <button onClick={() => setModalOpen(false)} className="absolute top-2 right-2 text-gray-400 hover:text-white">
        ✖
      </button>

      <h3 className="text-xl font-bold mb-2 text-white">{selectedDoc.name || "Document"}</h3>
      <p className="text-sm text-gray-400 mb-4">
        ID: <span className="font-mono">{selectedDoc.id}</span>
      </p>

      {selectedDoc.content ? (
        <pre className="p-3 bg-gray-800 rounded-md text-sm whitespace-pre-wrap text-gray-200">
          {selectedDoc.content}
        </pre>
      ) : (
        <p className="text-gray-500">No content available</p>
      )}

      {/* Edit button */}
      
    </div>
  </div>
)}


      {/* Confirm delete modal */}
      {confirmOpen && docToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-900 rounded-lg p-6 shadow-lg border border-gray-700 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{docToDelete.name}</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}