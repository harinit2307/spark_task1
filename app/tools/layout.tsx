'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import React from 'react';

const routes = [
  { label: 'Speech to Text', path: '/tools/speech-to-text' },
  { label: 'Text to Speech', path: '/tools/dashboard' },
  { label: 'Voice cloning', path: '/tools/voice-cloning' },
  { label: 'Conversation AI', path: '/tools/conversational AI' },
];

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname?.split('?')[0].replace(/\/$/, '');

  const handleLogout = () => {
    router.push('/auth/login');
  };

  return (
    <div>
      {/* Header */}
      <div className="relative bg-white shadow py-6 px-6 flex justify-center items-center">
        <div className="text-4xl font-bold text-black">ElevenLabs</div>
        <button
          onClick={handleLogout}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Scrollable Tabs with Increased Button Length */}
      <div className="overflow-x-auto bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-6 shadow-inner">
        <div className="flex gap-32 min-w-[160%] justify-start">
          {routes
            .filter(route => route.path !== currentPath)
            .map(route => (
              <Link
                key={route.path}
                href={route.path}
                className="min-w-[300px] text-center whitespace-nowrap px-6 py-4 rounded-full bg-white text-blue-700 font-medium text-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:scale-[1.03]"
              >
                {route.label} →
              </Link>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
