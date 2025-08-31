'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState } from 'react';
import { Menu } from 'lucide-react';

const routes = [
  { label: 'Text to Speech', path: '/tools/dashboard' },
  { label: 'Speech to Text', path: '/tools/speech-to-text' },
  { label: 'Conversation Chat', path: '/tools/convoai' },
  { label: 'Agents', path: '/tools/create-agent' },
  { label: 'Knowledge Base', path: '/tools/knowledge-base' },
  {label : 'Phone Number' , path: '/tools/phone-numbers'}
];

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = pathname?.split('?')[0].replace(/\/$/, '');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    router.push('/auth/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-[#0e111a] text-white flex font-sans transition-all duration-300">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-[260px]' : 'w-[60px]'
        } bg-[#141824] border-r border-gray-800 flex flex-col justify-between transition-all duration-300 overflow-hidden`}
      >
        <div>
          {/* Top Section with Burger */}
          <div className="flex items-center justify-between px-4 py-5">
            {sidebarOpen && (
              <div className="text-xl font-bold tracking-tight text-white whitespace-nowrap overflow-hidden truncate flex-shrink-0 pr-4">
                AI Interaction Tools
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="text-white p-2 hover:bg-white/10 rounded flex-shrink-0"
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Navigation */}
          {sidebarOpen && (
            <nav className="space-y-2 px-4 mt-4">
              {routes.map((route) => (
                <Link
                  key={route.path}
                  href={route.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      currentPath === route.path
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                        : 'text-gray-300 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white'
                    }`}
                >
                  <div className="w-3 h-3 rounded-full bg-white/40" />
                  <span>{route.label}</span>
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Logout */}
        {sidebarOpen && (
          <div className="px-4 pb-6">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-md w-full"
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#141824] border-b border-gray-800 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="text-2xl font-semibold text-white">Dashboard</div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#0e111a]">{children}</main>
      </div>
    </div>
  );
}