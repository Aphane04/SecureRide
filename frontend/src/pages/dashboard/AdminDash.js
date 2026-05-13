import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShieldAlert, Car, LogOut, 
  Settings, Bell, Search, ChevronRight, UserPlus, Clock, X
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const AdminDash = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // 1. Fetch Notifications Logic
  const fetchNotifications = async () => {
    try {
      const res = await adminAPI.getNotifications();
      setNotifications(res.data);
      // For demo: set unread count to length if dropdown is closed
      if (!showNotifications) setUnreadCount(res.data.length);
    } catch (err) {
      console.error("Notification sync failed");
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // 2. Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    setUnreadCount(0); // Clear red dot when opened
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
      isActive 
        ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border-r-4 border-white' 
        : 'text-gray-500 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-black text-white flex flex-col shadow-2xl z-20 relative">
        <nav className="flex-1 mt-12">
          <div className="px-10 py-4 text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">Administrative</div>
          <NavLink to="/dashboard/admin" end className={navLinkClass}>
            <div className="flex items-center gap-4"><LayoutDashboard size={18}/> <span>Dashboard</span></div>
            <ChevronRight size={12} />
          </NavLink>
          <NavLink to="drivers" className={navLinkClass}>
            <div className="flex items-center gap-4"><Car size={18}/> <span>Drivers</span></div>
            <ChevronRight size={12} />
          </NavLink>
          <NavLink to="passengers" className={navLinkClass}>
            <div className="flex items-center gap-4"><Users size={18}/> <span>Passengers</span></div>
            <ChevronRight size={12} />
          </NavLink>
          <NavLink to="alerts" className={navLinkClass}>
            <div className="flex items-center gap-4"><ShieldAlert size={18}/> <span>Safety Center</span></div>
            <ChevronRight size={12} />
          </NavLink>
          <div className="px-10 py-8 text-[9px] font-black text-gray-700 uppercase tracking-[0.3em] mb-2">System</div>
         <NavLink to="settings" className={navLinkClass}>
            <div className="flex items-center gap-4"><Settings size={18}/> <span>Settings</span></div>
            <ChevronRight size={12} />
          </NavLink>
        </nav>
        <div className="p-10 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-black text-[10px] uppercase tracking-widest hover:text-red-400 transition group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform"/> Logout System
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-12 z-10">
          <div className="flex items-center gap-4 bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
            <Search size={16} className="text-gray-400" />
            <input type="text" placeholder="Search global records..." className="bg-transparent border-none outline-none text-xs text-gray-600 w-64 font-medium" />
          </div>

          <div className="flex items-center gap-8 relative" ref={dropdownRef}>
            {/* FUNCTIONAL BELL ICON */}
            <div className="relative cursor-pointer group" onClick={handleBellClick}>
                <Bell size={20} className={`${showNotifications ? 'text-black' : 'text-gray-400'} group-hover:text-black transition-colors`} />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">{unreadCount}</span>
                    </div>
                )}
            </div>

            {/* NOTIFICATION DROPDOWN */}
            {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white border border-gray-100 shadow-2xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-widest">Recent Activity</h4>
                        <X size={14} className="text-gray-400 cursor-pointer" onClick={() => setShowNotifications(false)} />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">No recent events</div>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} className="p-5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <UserPlus size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-gray-800 leading-tight mb-1">{n.message}</p>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Clock size={10} />
                                                <span className="text-[9px] font-bold uppercase">{new Date(n.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 text-center bg-white">
                        <button className="text-[9px] font-black text-[#008751] uppercase tracking-widest hover:underline">View All Alerts</button>
                    </div>
                </div>
            )}

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