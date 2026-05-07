import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Car, 
  LogOut, 
  Settings,
  ChevronRight
} from 'lucide-react';

const AdminDash = () => {
  const navigate = useNavigate();

  // Updated navigation styling to match the premium "SecureRide" feel
  const navClass = ({ isActive }) =>
    `group flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
      isActive 
        ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_20px_rgba(0,135,81,0.1)]' 
        : 'text-gray-500 hover:bg-white/5 hover:text-white border border-transparent'
    }`;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white flex font-sans">
      
      {/* SIDEBAR: Glassmorphism Design */}
      <div className="w-72 bg-[#050505] border-r border-white/5 flex flex-col justify-between p-8 relative z-20">
        <div>
          {/* Branding */}
          <div className="flex items-center gap-3 mb-16 px-2">
            <div className="w-7 h-7 bg-green-600 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-white rounded-sm" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase">SecureRide</span>
          </div>

          <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-6 px-2">Main Menu</p>
          
          <div className="space-y-2">
            <NavLink to="/dashboard/admin" end className={navClass}>
              <div className="flex items-center gap-4">
                <LayoutDashboard size={16} />
                <span>Overview</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            <NavLink to="drivers" className={navClass}>
              <div className="flex items-center gap-4">
                <Car size={16} />
                <span>Drivers</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            <NavLink to="passengers" className={navClass}>
              <div className="flex items-center gap-4">
                <Users size={16} />
                <span>Passengers</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            <NavLink to="alerts" className={navClass}>
              <div className="flex items-center gap-4">
                <ShieldAlert size={16} />
                <span>Alert Center</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-4 pt-8 border-t border-white/5">
          <button className="flex items-center gap-4 px-5 py-3 text-gray-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
            <Settings size={16} /> Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        
        {/* Subtle Background Glow (Top Right) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        {/* Top Navbar */}
        <div className="h-20 border-b border-white/5 flex items-center justify-between px-12 bg-black/40 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Network Active: Terminal 01</span>
            </div>
            
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[10px] font-black text-white leading-none">Root Admin</p>
                    <p className="text-[9px] font-bold text-gray-600 mt-1 uppercase tracking-tighter">System Access: Full</p>
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center font-black text-xs">
                    RA
                </div>
            </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #22c55e; }
      `}</style>
    </div>
  );
};

export default AdminDash;