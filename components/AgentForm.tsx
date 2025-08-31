"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AgentFormProps {
  initialData?: {
    name: string;
    created_by: string;
    first_message: string;
    prompt: string;
    voice_id: string;
    knowledge_base_ids: string[];
  };
  mode?: "create" | "edit";
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export default function AgentForm({
  initialData,
  mode = "create",
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const [form, setForm] = useState(
    initialData || {
      name: "",
      created_by: "",
      first_message: "",
      prompt: "",
      voice_id: "",
      knowledge_base_ids: [],
    }
  );

  return (
    <div className="bg-[#0d0b1d] p-6 rounded-2xl shadow-lg text-white w-full max-w-md">
      <h1 className="text-xl font-bold mb-4">
        {mode === "create" ? "Create New Agent" : "Edit Agent"}
      </h1>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Agent Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-3 rounded-md bg-[#1c1a2e] text-white border border-gray-700"
        />

        <input
          type="text"
          placeholder="Created By"
          value={form.created_by}
          onChange={(e) => setForm({ ...form, created_by: e.target.value })}
          className="w-full p-3 rounded-md bg-[#1c1a2e] text-white border border-gray-700"
        />

        <textarea
          placeholder="First Message"
          value={form.first_message}
          onChange={(e) =>
            setForm({ ...form, first_message: e.target.value })
          }
          className="w-full p-3 rounded-md bg-[#1c1a2e] text-white border border-gray-700"
        />

        <textarea
          placeholder="System Prompt"
          value={form.prompt}
          onChange={(e) => setForm({ ...form, prompt: e.target.value })}
          className="w-full p-3 rounded-md bg-[#1c1a2e] text-white border border-gray-700"
        />

        <input
          type="text"
          placeholder="Voice ID"
          value={form.voice_id}
          onChange={(e) => setForm({ ...form, voice_id: e.target.value })}
          className="w-full p-3 rounded-md bg-[#1c1a2e] text-white border border-gray-700"
        />

        {/* Knowledge Base toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.knowledge_base_ids.length > 0}
            onChange={(e) =>
              setForm({
                ...form,
                knowledge_base_ids: e.target.checked ? ["dummy-kb-id"] : [],
              })
            }
          />
          <label className="text-sm text-gray-300">Use Knowledge Base</label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button
              variant="destructive"
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={() => onSubmit(form)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
          >
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
