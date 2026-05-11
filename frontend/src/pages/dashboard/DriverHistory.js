import React, { useEffect, useState } from 'react';
import { tripAPI } from '../../utils/api';
import { 
  MapPin, 
  Navigation, 
  Banknote, 
  Calendar, 
  ShieldCheck, 
  History, 
  Clock,
  ArrowUpRight,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const DriverHistory = () => {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Calls the /trips/driver-history endpoint
        const res = await tripAPI.getDriverHistory();
        setTrips(res.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.detail || 'System failed to sync mission history.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Helper to color statuses professionally
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'active': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'canceled': return 'bg-red-50 text-red-600 border-red-100';
      case 'searching': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  };

  return (
    <div className="min-h-full bg-white font-sans p-8 text-black">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#008751]">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operator Logs</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase leading-none">Mission Archive</h2>
            <p className="text-gray-400 text-xs mt-2 font-medium italic">Detailed record of all authorized driver assignments.</p>
          </div>

          <div className="bg-gray-50 px-6 py-4 rounded-[1.5rem] border border-gray-100 flex items-center gap-6 shadow-sm">
             <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned</p>
                <p className="text-xl font-black text-black">{trips.length}</p>
             </div>
             <div className="w-px h-8 bg-gray-200" />
             <div className="text-center">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Network</p>
                <p className="text-xs font-bold text-green-600 uppercase">Synchronized</p>
             </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-pulse">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-300">
                <Clock className="animate-spin mb-4" size={32} />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fetching local registry...</p>
            </div>
        ) : trips.length === 0 ? (
          <div className="h-96 border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300">
            <History size={48} className="mb-4 opacity-10" />
            <p className="text-[11px] font-black uppercase tracking-[0.3em]">No Mission Data Detected</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Route Logistics</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Earnings</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Status</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Completed At</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {trips.map((trip) => (
                  <tr key={trip.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <MapPin size={10} className="text-gray-300" />
                            <span className="text-[11px] font-bold text-gray-500 truncate max-w-[240px] uppercase tracking-tighter">
                                {trip.pickup_location}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Navigation size={10} className="text-[#008751]" />
                            <span className="text-xs font-black text-black truncate max-w-[240px]">
                                {trip.destination}
                            </span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-6">
                        <div className="flex items-center gap-2">
                            <Banknote size={14} className="text-gray-400" />
                            <span className="font-black text-sm text-[#008751]">R {trip.fare}</span>
                        </div>
                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Cash Terminal</p>
                    </td>

                    <td className="p-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>

                    <td className="p-6">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={12} />
                            <span className="text-[11px] font-bold">
                                {new Date(trip.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
                            {new Date(trip.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </td>

                    <td className="p-6 text-center">
                        <button className="p-2.5 rounded-xl bg-gray-100 text-gray-400 group-hover:bg-black group-hover:text-white transition-all shadow-sm">
                            <ArrowUpRight size={16} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-20 border-t border-gray-100 pt-10 text-center opacity-30 grayscale">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black text-center">SecureRide Operator Control Center</span>
        </div>
      </div>
    </div>
  );
};

export default DriverHistory;