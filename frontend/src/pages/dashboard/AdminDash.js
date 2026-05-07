import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShieldAlert, Car, LogOut, 
  Settings, Bell, Search, User
} from 'lucide-react';

const AdminDash = () => {
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-6 py-4 text-sm font-medium transition-all ${
      isActive 
        ? 'bg-green-600 text-white shadow-lg' 
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-[#f4f7fe] flex font-sans">
      {/* SIDEBAR: Inspired by the image sidebar */}
      <div className="w-72 bg-[#1a1f37] text-white flex flex-col shadow-2xl z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-green-500 p-1.5 rounded-lg">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">SecureRide</span>
        </div>

        <nav className="flex-1 mt-4">
          <div className="px-8 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Menu</div>
          <NavLink to="/dashboard/admin" end className={navLinkClass}><LayoutDashboard size={18}/> Dashboard</NavLink>
          <NavLink to="drivers" className={navLinkClass}><Car size={18}/> Drivers</NavLink>
          <NavLink to="passengers" className={navLinkClass}><Users size={18}/> Student Work</NavLink>
          <NavLink to="alerts" className={navLinkClass}><ShieldAlert size={18}/> Alert Center</NavLink>
          <NavLink to="settings" className={navLinkClass}><Settings size={18}/> Settings</NavLink>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button 
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="flex items-center gap-3 text-red-400 font-bold text-sm hover:text-red-300 transition"
          >
            <LogOut size={18}/> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f7fe]">
        {/* Top Header from the image */}
        <header className="h-20 bg-transparent flex items-center justify-between px-10">
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Global search..." className="bg-transparent border-none outline-none text-sm text-gray-600 w-64" />
          </div>

          <div className="flex items-center gap-6">
            <Bell size={20} className="text-gray-400 cursor-pointer" />
            <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
               <div className="text-right">
                 <p className="text-sm font-bold text-[#1a1f37]">Root Admin</p>
                 <p className="text-[10px] text-gray-400 font-medium">Super User</p>
               </div>
               <div className="w-10 h-10 bg-[#1a1f37] rounded-full flex items-center justify-center text-white font-bold text-xs">
                 RA
               </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-10 pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDash;