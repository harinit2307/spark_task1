"use client";

import { useState, useEffect } from "react";

interface Document {
  id: string;
  name: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export default function KnowledgeBasePage() {
  const [mode, setMode] = useState<"text" | "url" | "file">("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/knowledge-base");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (data?.documents) {
        setDocuments(data.documents);
      }
    } catch {
      setDocuments([]);
    }
  };

  const fetchDocumentDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge-base/${id}`);
      const data = await res.json();
      setSelectedDoc(data);
      setModalOpen(true);
    } catch {
      setSelectedDoc(null);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let res;

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
      if (data?.success) {
        setMessage("✅ Knowledge base updated successfully");
        fetchDocuments(); // refresh list
        setText("");
        setUrl("");
        setFile(null);
      } else {
        setMessage(data?.error || "Upload failed");
      }
    } catch {
      setMessage("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      {/* Upload section */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setMode("text")}
          className={`px-4 py-2 rounded-md ${mode === "text" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Text
        </button>
        <button
          onClick={() => setMode("url")}
          className={`px-4 py-2 rounded-md ${mode === "url" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          URL
        </button>
        <button
          onClick={() => setMode("file")}
          className={`px-4 py-2 rounded-md ${mode === "file" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          File
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "text" && (
          <textarea
            className="w-full p-3 border rounded-md"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter knowledge base text..."
          />
        )}

        {mode === "url" && (
          <input
            type="url"
            className="w-full p-3 border rounded-md"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a webpage URL..."
          />
        )}

        {mode === "file" && (
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={loading}
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {message && (
        <div className="mt-4 p-3 rounded-md bg-gray-100 border">
          {message}
        </div>
      )}

      {/* Documents list */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Uploaded Documents</h2>
      <div className="bg-white border rounded-lg shadow">
        <div className="grid grid-cols-3 font-semibold bg-gray-100 px-4 py-2">
          <div>Name</div>
          <div>Created By</div>
          <div>Last Updated</div>
        </div>
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="grid grid-cols-3 px-4 py-2 border-t hover:bg-gray-50 cursor-pointer"
            onClick={() => fetchDocumentDetails(doc.id)}
          >
            <div>{doc.name || "Untitled"}</div>
            <div>{doc.created_by || "N/A"}</div>
            <div>
              {doc.updated_at
                ? new Date(doc.updated_at).toLocaleString()
                : "N/A"}
            </div>
          </div>
        ))}
      </div>

      {/* Modal popup */}
      {modalOpen && selectedDoc && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-2/3 rounded-lg p-6 shadow-lg relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ✖
            </button>
            <h3 className="text-xl font-bold mb-2">{selectedDoc.name}</h3>
            <p className="text-sm text-gray-600 mb-4">
              ID: <span className="font-mono">{selectedDoc.id}</span>
            </p>
            {selectedDoc.content ? (
              <pre className="p-3 bg-gray-100 rounded-md text-sm whitespace-pre-wrap">
                {selectedDoc.content}
              </pre>
            ) : (
              <p className="text-gray-500">No content available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
