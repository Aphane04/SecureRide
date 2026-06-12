import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShieldAlert, Car, LogOut, 
  Settings, Bell, Search, ChevronRight, UserPlus, Clock, X, RefreshCw, AlertTriangle
} from 'lucide-react';
import { adminAPI } from '../../utils/api';

const AdminDash = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch Notifications Logic (Handles both Reg and AI Alerts)
  const fetchNotifications = async () => {
    try {
      setIsSyncing(true);
      const res = await adminAPI.getNotifications();
      const data = Array.isArray(res.data) ? res.data : [];
      setNotifications(data);
      
      // Update unread count if dropdown is closed
      if (!showNotifications) {
        setUnreadCount(data.length);
      }
    } catch (err) {
      console.error("Notification sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
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

  // Time Formatter with Local Timezone Fix
  const formatLocalTime = (timeStr) => {
    if (!timeStr) return "--:--";
    // Add 'Z' to force UTC interpretation so browser converts to local time
    const date = new Date(timeStr.endsWith('Z') ? timeStr : timeStr + 'Z');
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      
      {/* SIDEBAR: Pure Black & Professional */}
      <div className="w-72 bg-black text-white flex flex-col shadow-2xl z-20 relative shrink-0">
        <div className="p-10 flex items-center gap-3">
          <div className="bg-green-500 p-1.5 rounded-lg shadow-lg">
            <ShieldAlert size={20} className="text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase">SecureRide</span>
        </div>

        <nav className="flex-1">
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
        
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-12 z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-orange-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_#22c55e]'}`} />
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Network Status: Secure</span>
          </div>

          <div className="flex items-center gap-8 relative" ref={dropdownRef}>
            
            {/* FUNCTIONAL BELL ICON */}
            <div 
              className="relative cursor-pointer group" 
              onClick={() => { setShowNotifications(!showNotifications); setUnreadCount(0); }}
            >
                <Bell size={20} className={`${showNotifications ? 'text-black' : 'text-gray-400'} group-hover:text-black transition-colors`} />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                        <span className="text-[8px] font-bold text-white">{unreadCount}</span>
                    </div>
                )}
            </div>

            {/* NOTIFICATION DROPDOWN */}
            {showNotifications && (
                <div className="absolute top-12 right-0 w-80 bg-white border border-gray-100 shadow-2xl rounded-[2rem] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Live Activity Feed</h4>
                        <RefreshCw size={12} className={`text-gray-400 ${isSyncing ? 'animate-spin' : 'cursor-pointer'}`} onClick={fetchNotifications} />
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">No recent alerts</div>
                        ) : (
                            notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`p-5 border-b border-gray-50 transition-colors cursor-pointer group ${n.type === 'SAFETY_ALERT' ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        if(n.type === 'SAFETY_ALERT') navigate('alerts');
                                        else navigate(n.message.toLowerCase().includes('driver') ? 'drivers' : 'passengers');
                                        setShowNotifications(false);
                                    }}
                                >
                                    <div className="flex gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${n.type === 'SAFETY_ALERT' ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200' : 'bg-green-50 text-green-600'}`}>
                                            {n.type === 'SAFETY_ALERT' ? <AlertTriangle size={18} /> : <UserPlus size={18} />}
                                        </div>
                                        <div>
                                            <p className={`text-[11px] font-black leading-tight mb-1 ${n.type === 'SAFETY_ALERT' ? 'text-red-700' : 'text-gray-800'}`}>{n.message}</p>
                                            <div className="flex items-center gap-2 text-gray-400 font-bold">
                                                <Clock size={10} />
                                                <span className="text-[9px] uppercase">{formatLocalTime(n.time)}</span>
                                                {n.type === 'SAFETY_ALERT' && (
                                                    <span className="text-[7px] bg-red-600 text-white px-1 py-0.5 rounded font-black tracking-tighter">CRITICAL</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 text-center bg-white">
                        <button onClick={() => {navigate('alerts'); setShowNotifications(false);}} className="text-[9px] font-black text-[#008751] uppercase tracking-widest hover:underline">Monitor All Safety Logs</button>
                    </div>
                </div>
            )}

            {/* Profile Section */}
            <div className="flex items-center gap-4 border-l pl-8 border-gray-100">
               <div className="text-right">
                 <p className="text-xs font-black text-black uppercase tracking-tighter leading-none">Root Admin</p>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Super User</p>
               </div>
               <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg border-2 border-green-500">
                 RA
               </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT: The Outlet makes the individual pages (Overview, Alerts, etc.) appear */}
        <main className="flex-1 overflow-y-auto bg-[#f8f9fa] custom-scrollbar">
          <div className="p-12">
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #008751; }
      `}</style>
    </div>
  );
};

export default AdminDash;