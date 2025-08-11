'use client';

import { useEffect, useState } from 'react';

interface NotificationPopupProps {
  show: boolean;
  agentName: string;
  onClose: () => void;
  onDecline: () => void;
}

export default function NotificationPopup({
  show,
  agentName,
  onClose,
  onDecline,
}: NotificationPopupProps) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (show) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 w-96 rounded-lg bg-white shadow-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 flex items-center justify-center bg-green-100 rounded-full">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Agent Added</h4>
          <p className="text-sm text-gray-600">
            Agent <strong>{agentName}</strong> created successfully.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              className="text-sm px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setVisible(false);
                onDecline();
              }}
            >
              Decline
            </button>
            <button
              className="text-sm px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => {
                setVisible(false);
                onClose();
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
