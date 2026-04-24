import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-[#121212] border-b border-gray-900 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#008751] rounded-lg"></div>
          <span className="text-white font-bold tracking-tighter text-xl">SecureRide</span>
        </div>
        
        {user && (
          <div className="flex items-center gap-6">
            <span className="text-gray-400 text-sm hidden md:block">Role: <b className="text-green-500">{user.role}</b></span>
            <button onClick={logout} className="text-xs text-red-500 border border-red-900/30 px-3 py-1 rounded hover:bg-red-900/10 transition">
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};