import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Users, Car, ShieldAlert, Navigation, 
  Clock, MapPin, Activity, ChevronRight, 
  MoreHorizontal, Banknote 
} from 'lucide-react';

const AdminOverview = () => {
  const [overview, setOverview] = useState({ drivers: 0, passengers: 0, active_trips: 0, safety_alerts: 0 });
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            const [ovRes, tripRes] = await Promise.all([
                adminAPI.overview(),
                adminAPI.trips()
            ]);
            setOverview(ovRes.data || { drivers: 0, passengers: 0, active_trips: 0, safety_alerts: 0 });
            setTrips(Array.isArray(tripRes.data) ? tripRes.data : []);
        } catch (err) {
            console.error("Dashboard sync error:", err);
        } finally {
            setLoading(false);
        }
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-black animate-in fade-in duration-700">
      
      {/* 1. Stats Section (Dark) */}
      <div className="bg-[#0a0a0a] p-10 pb-24 rounded-b-[3rem] shadow-2xl">
        <div className="max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Network Intelligence</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Live System Terminal 01</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2 rounded-full backdrop-blur-md">
                    <Activity size={14} className="text-green-500 animate-pulse" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">System Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard label="Active Drivers" value={overview?.drivers} icon={<Car size={24}/>} color="border-green-500" />
                <StatCard label="Authorized Passengers" value={overview?.passengers} icon={<Users size={24}/>} color="border-blue-500" />
                <StatCard label="Safety Alerts (Live)" value={overview?.safety_alerts} icon={<ShieldAlert size={24}/>} color="border-red-500" isAlert={overview?.safety_alerts > 0} />
            </div>
        </div>
      </div>

      {/* 2. Recent Trips Table (White Card) */}
      <div className="max-w-[1600px] mx-auto px-8 -mt-12 mb-20">
        <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-xl tracking-tight uppercase">Operational Logs</h3>
            <span className="text-[10px] font-black bg-black text-white px-4 py-1.5 rounded-full uppercase tracking-widest">
                {trips?.length || 0} Missions Detected
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Identity</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Mission Route</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fare</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="text-black">
              {loading ? (
                  <tr><td colSpan="5" className="p-32 text-center text-gray-300 font-black uppercase animate-pulse tracking-widest">Syncing Records...</td></tr>
              ) : trips.length > 0 ? trips.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white">
                            {/* SAFE CHAR ACCESS */}
                            {t.passenger_email ? t.passenger_email.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="font-black text-sm">{t.passenger_email || 'System User'}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5 truncate max-w-xs">
                            <MapPin size={12} className="text-gray-200"/> {t.pickup_location}
                        </span>
                        <span className="text-xs font-black text-black flex items-center gap-1.5 truncate max-w-xs uppercase">
                            <Navigation size={12} className="text-green-600"/> {t.destination}
                        </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                        <Banknote size={16} className="text-green-600" />
                        <span className="text-sm font-black">R {t.fare}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="p-6 text-center">
                    <button className="p-2.5 bg-gray-100 rounded-xl hover:bg-black hover:text-white transition-all text-gray-400">
                        <MoreHorizontal size={18}/>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-32 text-center text-gray-400 uppercase font-black text-xs italic">Registry currently empty</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Stats Card
const StatCard = ({ label, value, icon, color, isAlert }) => (
  <div className={`bg-[#151515] p-8 rounded-[2.5rem] border-b-4 ${color} relative overflow-hidden group`}>
    <div className={`absolute top-6 right-6 text-gray-800 transition-colors ${isAlert ? 'text-red-600 animate-pulse' : ''}`}>
        {icon}
    </div>
    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{label}</p>
    <h4 className={`text-5xl font-black text-white tracking-tighter ${isAlert && value > 0 ? 'text-red-500' : ''}`}>
        {value || 0}
    </h4>
  </div>
);

// Sub-component: Status Badges
const StatusBadge = ({ status }) => {
    let style = "bg-gray-100 text-gray-500 border-gray-200";
    const s = status?.toLowerCase();
    if (s === "searching") style = "bg-orange-50 text-orange-600 border-orange-100";
    if (s === "active") style = "bg-blue-50 text-blue-600 border-blue-100";
    if (s === "completed") style = "bg-green-50 text-green-600 border-green-100";
    if (s === "canceled") style = "bg-red-50 text-red-600 border-red-100";
    
    return (
        <span className={`${style} px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border`}>
            {status || 'Unknown'}
        </span>
    );
};

export default AdminOverview;