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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 text-white custom-scrollbar scrollbar-thin scrollbar-thumb-purple-700 scrollbar-track-black">
      {/* Header */}
      <div className="relative py-6 px-6 flex justify-center items-center border-b border-gray-700 bg-gradient-to-br from-purple-900 via-black to-blue-900 shadow-md">
        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          ElevenLabs
        </div>
        <button
          onClick={handleLogout}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>

      {/* Scrollable Tabs */}
      <div className="overflow-x-auto bg-gradient-to-br from-blue-900 via-black to-purple-900 py-6 px-6 shadow-inner">
        <div className="flex gap-32 min-w-[160%] justify-start">
          {routes
            .filter(route => route.path !== currentPath)
            .map(route => (
              <Link
                key={route.path}
                href={route.path}
                className="min-w-[300px] text-center whitespace-nowrap px-6 py-4 rounded-full bg-gray-900 text-purple-400 mb-2 font-medium text-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:scale-[1.03]"
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
