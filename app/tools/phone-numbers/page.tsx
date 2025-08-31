//app/tools/phone-numbes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Phone, Plus, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ElevenLabsPhoneNumber {
  phone_number_id: string;
  phone_number: string;
  description?: string;
  created_at?: string;
}

interface ApiResponse {
  success?: boolean;
  id?: string;
  phone_number?: string;
  description?: string;
  created_at?: string;
  phone_numbers?: ElevenLabsPhoneNumber[];
  error?: boolean;
  message?: string;
  detail?: any;
  raw?: any;
}

export default function PhoneNumberPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [existingNumbers, setExistingNumbers] = useState<ElevenLabsPhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // Load existing phone numbers on component mount
  useEffect(() => {
    loadExistingNumbers();
  }, []);

  const loadExistingNumbers = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/phone-numbers");
      const data = await res.json();
      
      if (data.success && data.phone_numbers) {
        setExistingNumbers(data.phone_numbers);
      }
    } catch (err) {
      console.error("Failed to load existing numbers:", err);
    } finally {
      setListLoading(false);
    }
  };

  const handleCreatePhoneNumber = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }

    setLoading(true);
    setResponse(null);
    
    try {
      const res = await fetch("/api/phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone_number: phoneNumber.trim(),
          description: description.trim() || undefined
        }),
      });

      const data = await res.json();
      console.log("ElevenLabs API response:", data);
      setResponse(data);
      
      // Reload the list if successful
      if (data.success) {
        setPhoneNumber("");
        setDescription("");
        loadExistingNumbers();
      }
    } catch (err) {
      console.error("Request failed:", err);
      setResponse({
        error: true,
        message: "Request failed",
        detail: err
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-pink-500" />
            ElevenLabs Phone Number Integration
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Create Phone Number */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Phone Number
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Input
              placeholder="Enter phone number (e.g., +1234567890)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button 
              onClick={handleCreatePhoneNumber} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Phone Number
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Phone Numbers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <List className="h-5 w-5" />
            Your Phone Numbers
            <Button
              variant="outline"
              size="sm"
              onClick={loadExistingNumbers}
              disabled={listLoading}
              className="ml-auto"
            >
              {listLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading phone numbers...</span>
            </div>
          ) : existingNumbers.length > 0 ? (
            <div className="space-y-3">
              {existingNumbers.map((number) => (
                <div 
                  key={number.phone_number_id} 
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-mono text-sm font-semibold">
                      {number.phone_number}
                    </div>
                    {number.description && (
                      <div className="text-sm text-gray-600 mt-1">
                        {number.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {number.phone_number_id}
                    </div>
                    {number.created_at && (
                      <div className="text-xs text-gray-400">
                        Created: {new Date(number.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No phone numbers found. Create your first one above!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Display */}
      {response && (
        <Card>
          <CardContent className="pt-6">
            {response.success ? (
              <div className="p-4 rounded-md bg-green-100 text-green-800">
                <p className="font-semibold">✅ Phone Number Created Successfully!</p>
                <div className="mt-2 space-y-1">
                  <p><strong>ID:</strong> {response.id}</p>
                  <p><strong>Phone Number:</strong> {response.phone_number}</p>
                  {response.description && (
                    <p><strong>Description:</strong> {response.description}</p>
                  )}
                  {response.created_at && (
                    <p><strong>Created:</strong> {new Date(response.created_at).toLocaleString()}</p>
                  )}
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm">🔍 Raw Response</summary>
                  <pre className="text-xs bg-gray-900 text-white p-2 rounded-md overflow-x-auto mt-2">
                    {JSON.stringify(response.raw, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="p-4 rounded-md bg-red-100 text-red-800">
                <p className="font-semibold">❌ Error</p>
                <p className="mt-1">{response.message || "Failed to create phone number"}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Error Details</summary>
                  <pre className="text-xs bg-gray-900 text-white p-2 rounded-md overflow-x-auto mt-1">
                    {JSON.stringify(response.detail, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}