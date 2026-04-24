import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-black border-b border-gray-900 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer" 
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 bg-brand-green rounded flex items-center justify-center shadow-[0_0_15px_rgba(0,135,81,0.4)]">
          <span className="text-black font-black text-xs">SR</span>
        </div>
        <span className="text-white font-bold tracking-tighter text-xl hidden sm:block">
          Secure<span className="text-brand-green">Ride</span>
        </span>
      </div>

      {/* Dynamic Navigation Links */}
      <div className="flex items-center gap-8">
        {user ? (
          <>
            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              {user.role === 'Passenger' && (
                <>
                  <Link to="/dashboard/passenger" className="text-gray-400 hover:text-brand-green transition">Book Ride</Link>
                  <Link to="/history" className="text-gray-400 hover:text-brand-green transition">Trips</Link>
                </>
              )}
              {user.role === 'Driver' && (
                <>
                  <Link to="/dashboard/driver" className="text-gray-400 hover:text-brand-green transition">Ride Requests</Link>
                  <Link to="/vehicle-settings" className="text-gray-400 hover:text-brand-green transition">Vehicle</Link>
                </>
              )}
              {user.role === 'Admin' && (
                <>
                  <Link to="/dashboard/admin" className="text-gray-400 hover:text-brand-green transition">Monitoring</Link>
                  <Link to="/user-management" className="text-gray-400 hover:text-brand-green transition">Users</Link>
                </>
              )}
            </div>

            {/* Profile & Logout */}
            <div className="flex items-center gap-4 border-l border-gray-800 pl-6">
              <div className="text-right hidden lg:block">
                <p className="text-xs text-white font-bold">{user.email.split('@')[0]}</p>
                <p className="text-[10px] text-brand-green uppercase tracking-widest">{user.role}</p>
              </div>
              <button 
                onClick={logout}
                className="bg-[#1a1a1a] hover:bg-red-900/20 text-red-500 text-xs px-4 py-2 rounded transition border border-red-900/30"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-4">
            <Link to="/login" className="text-gray-400 text-sm hover:text-white transition">Sign in</Link>
            <Link to="/register" className="bg-brand-green text-white text-sm px-5 py-2 rounded font-bold hover:bg-green-700 transition">
              Join
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;