'use client';

import React, { useState, useEffect } from 'react';
import { FaLink, FaFileUpload, FaKeyboard, FaSearch, FaTrash } from 'react-icons/fa';

interface DocumentItem {
  id: string;
  name: string;
  type: string;
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch docs from backend API
  const fetchDocuments = async () => {
    setLoading(true);
    const res = await fetch('/api/tools/knowledge-base');
    const data = await res.json();
    setDocuments(data.documents || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Add URL/Text/File
  const addDocument = async (type: string) => {
    let content: any;

    if (type === 'url') {
      content = prompt("Enter the URL:");
    } else if (type === 'text') {
      content = prompt("Enter the text:");
    } else if (type === 'file') {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.onchange = async (e: any) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);
        await fetch('/api/tools/knowledge-base', {
          method: 'POST',
          body: formData
        });
        fetchDocuments();
      };
      fileInput.click();
      return;
    }

    if (!content) return;

    await fetch('/api/tools/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content })
    });

    fetchDocuments();
  };

  // Delete document
  const deleteDocument = async (id: string) => {
    await fetch('/api/tools/knowledge-base', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchDocuments();
  };

  return (
    <div className="bg-black min-h-screen text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      {/* Buttons */}
      <div className="flex gap-4 mb-6">
        <button onClick={() => addDocument('url')} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
          <FaLink /> Add URL
        </button>
        <button onClick={() => addDocument('file')} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
          <FaFileUpload /> Add Files
        </button>
        <button onClick={() => addDocument('text')} className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
          <FaKeyboard /> Create Text
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex items-center bg-gray-900 px-3 py-2 rounded-lg">
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search Knowledge Base..."
            className="bg-transparent outline-none text-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Document List */}
      <div className="bg-gray-900 rounded-lg p-6 min-h-[300px]">
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : documents.length === 0 ? (
          <div className="text-gray-400 text-center">
            <p className="text-lg font-semibold">No documents found</p>
            <p className="text-sm">You don't have any documents yet.</p>
          </div>
        ) : (
          documents
            .filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(doc => (
              <div key={doc.id} className="bg-gray-800 p-4 rounded-lg mb-2 flex justify-between items-center">
                <div>
                  <span className="block">{doc.name}</span>
                  <span className="text-gray-400 text-sm">{doc.type}</span>
                </div>
                <button onClick={() => deleteDocument(doc.id)} className="text-red-500 hover:text-red-400">
                  <FaTrash />
                </button>
              </div>
            ))
        )}
      </div>
    </div>
  );
}