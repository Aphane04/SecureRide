import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  Car, 
  LogOut, 
  Settings,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react';

const AdminDash = () => {
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
      isActive 
        ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border-r-4 border-white' 
        : 'text-gray-500 hover:bg-white/5 hover:text-white'
    }`;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      
      {/* SIDEBAR: Logo Removed, labels and spacing adjusted */}
      <div className="w-72 bg-black text-white flex flex-col shadow-2xl z-20 relative">
        
        {/* We removed the <div> with the logo here */}

        <nav className="flex-1 mt-12"> {/* Added more top margin for a cleaner start */}
          <div className="px-10 py-4 text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">Administrative</div>
          
          <NavLink to="/dashboard/admin" end className={navLinkClass}>
            <div className="flex items-center gap-4">
                <LayoutDashboard size={18}/> <span>Dashboard</span>
            </div>
            <ChevronRight size={12} />
          </NavLink>

          <NavLink to="drivers" className={navLinkClass}>
            <div className="flex items-center gap-4">
                <Car size={18}/> <span>Drivers</span>
            </div>
            <ChevronRight size={12} />
          </NavLink>

          <NavLink to="passengers" className={navLinkClass}>
            <div className="flex items-center gap-4">
                <Users size={18}/> <span>Passengers</span>
            </div>
            <ChevronRight size={12} />
          </NavLink>

          <NavLink to="alerts" className={navLinkClass}>
            <div className="flex items-center gap-4">
                <ShieldAlert size={18}/> <span>Safety Center</span>
            </div>
            <ChevronRight size={12} />
          </NavLink>

          <div className="px-10 py-8 text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">System</div>
          
          <NavLink to="settings" className={navLinkClass}>
            <div className="flex items-center gap-4">
                <Settings size={18}/> <span>Settings</span>
            </div>
            <ChevronRight size={12} />
          </NavLink>
        </nav>

        {/* Logout section */}
        <div className="p-10 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-400 transition group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> Logout System
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-12 z-10">
          <div className="flex items-center gap-4 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
            <Search size={16} className="text-gray-400" />
            <input 
                type="text" 
                placeholder="Search global records..." 
                className="bg-transparent border-none outline-none text-xs text-gray-600 w-64 font-medium" 
            />
          </div>

          <div className="flex items-center gap-8">
            <div className="relative cursor-pointer group">
                <Bell size={20} className="text-gray-400 group-hover:text-black transition-colors" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </div>

            <div className="flex items-center gap-4 border-l pl-8 border-gray-100">
               <div className="text-right">
                 <p className="text-xs font-black text-black uppercase tracking-tighter">Root Admin</p>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Super User</p>
               </div>
               <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg border-2 border-green-500">
                 RA
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#f8f9fa] custom-scrollbar">
          <div className="p-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDash;