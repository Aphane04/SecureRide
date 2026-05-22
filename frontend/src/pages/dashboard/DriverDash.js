import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  History, Phone, User, Map as MapIcon, UserX, 
  ChevronRight, ShieldCheck, Activity, AlertTriangle 
} from 'lucide-react';
import { authAPI, tripAPI } from '../../utils/api';
import { useAiMonitor } from '../../utils/aiMonitor'; // Import the monitor

const DriverDash = () => {
  const [fullName, setFullName] = useState('Driver');
  const [activeTripId, setActiveTripId] = useState(null);
  const navigate = useNavigate();

  // Initialize AI Monitoring logic
  const { dangerDetected } = useAiMonitor(activeTripId);

  useEffect(() => {
    // 1. Get User Profile
    authAPI.getProfile().then((res) => {
      if (res.data?.full_name) setFullName(res.data.full_name);
    });

    // 2. Initial Active Trip Check
    const checkActiveTrip = async () => {
      try {
        const res = await tripAPI.getActiveTrip();
        if (res.data && res.data.status === 'Active') {
          setActiveTripId(res.data.id);
        } else {
          setActiveTripId(null);
        }
      } catch (err) {
        setActiveTripId(null);
      }
    };

    checkActiveTrip();
    const interval = setInterval(checkActiveTrip, 10000); // Check every 10s for new missions
    return () => clearInterval(interval);
  }, []);

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "CRITICAL: Are you sure you want to permanently delete your Driver Account? This will purge all records. This cannot be undone."
    );

    if (confirmed) {
      try {
        await authAPI.deleteAccount();
        localStorage.clear();
        alert("Account Terminated.");
        window.location.href = '/register';
      } catch (err) {
        const reason = err.response?.data?.detail || "Unknown Server Error";
        alert(`System Error: ${reason}. Please contact system administrator.`);
      }
    }
  };

  const navClass = ({ isActive }) =>
    `group flex items-center justify-between px-4 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
      isActive 
        ? 'bg-gray-200 text-black border-l-4 border-[#008751] shadow-sm' 
        : 'text-black hover:bg-gray-100'
    }`;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white font-sans overflow-hidden text-black">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-200 p-8 flex flex-col justify-between z-20">
        <div>
          {/* Driver Branding & Safety Status */}
          <div className="mb-12 px-2">
            <div className={`flex items-center gap-2 mb-1 transition-colors duration-500 ${dangerDetected ? 'text-red-600' : 'text-[#008751]'}`}>
                {dangerDetected ? <AlertTriangle size={14} className="animate-bounce" /> : <ShieldCheck size={14} />}
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                  {dangerDetected ? 'Safety Breach' : 'Verified Driver'}
                </span>
            </div>
            <p className="text-2xl font-black text-black tracking-tighter truncate">
                {fullName.split(' ')[0]}
            </p>

            {/* AI Monitor Visual Feedback */}
            {activeTripId && (
              <div className={`mt-4 px-3 py-2 rounded-lg flex items-center gap-3 border ${dangerDetected ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-100'}`}>
                <Activity size={12} className={dangerDetected ? 'text-red-600' : 'text-green-600 animate-pulse'} />
                <span className={`text-[8px] font-black uppercase tracking-widest ${dangerDetected ? 'text-red-700' : 'text-green-700'}`}>
                  AI Monitor Active
                </span>
              </div>
            )}
          </div>

          <nav className="space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Operator Menu</p>
            
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

        {/* Action Bottom */}
        <div className="pt-6 border-t border-gray-50">
          <button 
            onClick={handleDeleteAccount}
            className="flex items-center gap-3 px-4 py-3 text-[#991b1b] hover:text-white hover:bg-[#991b1b] transition-all text-[11px] font-black uppercase tracking-widest rounded-xl w-full"
          >
            <UserX size={18} /> Delete Account
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto bg-[#f3f4f6] p-6">
        <div className="h-full w-full bg-white rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-sm relative">
            <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DriverDash;