import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { History, Phone, User, Map as MapIcon, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../utils/api';

const DriverDash = () => {
  const [fullName, setFullName] = useState('Driver');
  const navigate = useNavigate();

  useEffect(() => {
    authAPI.getProfile().then((res) => {
      if (res.data?.full_name) setFullName(res.data.full_name);
    });
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Selection Logic: Black font, Gray background for "pop", and Green active border
  const navClass = ({ isActive }) =>
    `group flex items-center justify-between px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
      isActive 
        ? 'bg-gray-200 text-black border-l-4 border-[#008751] shadow-sm' 
        : 'text-black hover:bg-gray-100'
    }`;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white font-sans overflow-hidden text-black">
      
      {/* SIDEBAR: Pure White & Professional */}
      <aside className="w-72 bg-white border-r border-gray-200 p-8 flex flex-col justify-between z-20">
        <div>
          {/* Driver Branding */}
          <div className="mb-12 px-2">
            <div className="flex items-center gap-2 mb-1 text-[#008751]">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Driver</span>
            </div>
            <p className="text-2xl font-black text-black tracking-tighter truncate">
                {fullName.split(' ')[0]}
            </p>
          </div>

          <nav className="space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Operator Menu</p>
            
            {/* Renamed Dashboard to Map */}
            <NavLink to="/dashboard/driver" end className={navClass}>
              <div className="flex items-center gap-3">
                <MapIcon size={18} /> <span>Map</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            <NavLink to="history" className={navClass}>
              <div className="flex items-center gap-3">
                <History size={18} /> <span>Trip History</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            <NavLink to="contacts" className={navClass}>
              <div className="flex items-center gap-3">
                <Phone size={18} /> <span>Emergency</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>

            <NavLink to="account" className={navClass}>
              <div className="flex items-center gap-3">
                <User size={18} /> <span>Profile</span>
              </div>
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          </nav>
        </div>

        {/* Logout Section: Deep Red Typography */}
        <div className="pt-6 border-t border-gray-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-[#991b1b] hover:text-[#7f1d1d] transition-all text-[11px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl w-full"
          >
            <LogOut size={18} /> Logout Terminal
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA: Dim White (Greyish-white) */}
      <main className="flex-1 overflow-auto bg-[#f3f4f6] p-6">
        {/* Inner container is pure white to make the content pop against the grey background */}
        <div className="h-full w-full bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm relative">
            <Outlet />
        </div>
      </main>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #008751; }
      `}</style>
    </div>
  );
};

export default DriverDash;