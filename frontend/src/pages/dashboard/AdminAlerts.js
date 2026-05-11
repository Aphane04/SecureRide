import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, Search, Filter, MessageSquare, 
  Clock, Map, Eye, X, Activity, AlertTriangle, RefreshCw 
} from 'lucide-react';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Function to fetch data
  const loadAlerts = async () => {
    try {
      setIsSyncing(true);
      const res = await adminAPI.alerts();
      setAlerts(res.data);
    } catch (err) {
      console.error("Safety sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    // REAL-TIME POLLING: Check for new danger every 10 seconds
    const timer = setInterval(loadAlerts, 10000); 
    return () => clearInterval(timer);
  }, []);

  const getSeverity = (transcript) => {
    const t = transcript.toLowerCase();
    const dangerTerms = ['help', 'stop', 'weapon', 'police', 'kill', 'touch', 'no'];
    if (dangerTerms.some(word => t.includes(word))) {
        return { label: 'CRITICAL', color: 'bg-red-50 text-red-600', dot: 'bg-red-600' };
    }
    return { label: 'WARNING', color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-600' };
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <div className="p-8 max-w-[1600px] mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-500">
                <Activity size={16} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Safety Feed</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white uppercase">Alert Center</h2>
            <p className="text-gray-500 text-sm font-medium">Monitoring {alerts.length} neural safety logs</p>
          </div>
          
          <div className="flex items-center gap-4">
             {isSyncing && <RefreshCw size={16} className="animate-spin text-gray-700" />}
             <button className="bg-red-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95">
                EMERGENCY PROTOCOLS
             </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trip Ref</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Transcript Snapshot</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Timestamp</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {alerts.length > 0 ? alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className="hover:bg-red-50/30 border-b border-gray-50 transition-colors">
                    <td className="p-5">
                        <span className={`${severity.color} px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 w-fit border border-current opacity-80`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${severity.dot} animate-pulse`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-5">
                        <span className="font-black text-xs text-black uppercase">SR-#{a.trip_id}</span>
                    </td>
                    <td className="p-5">
                        <p className="text-sm font-medium text-gray-600 max-w-md truncate italic">"{a.transcript}"</p>
                    </td>
                    <td className="p-5 text-center text-[11px] font-bold text-gray-400 uppercase">
                        {new Date(a.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-5 text-center">
                        <button 
                            onClick={() => setSelectedAlert(a)}
                            className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black tracking-widest hover:bg-red-600 transition-all shadow-md"
                        >
                            REVIEW
                        </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                    <td colSpan="5" className="p-24 text-center">
                        <ShieldAlert size={48} className="mx-auto text-gray-100 mb-4" />
                        <p className="text-gray-300 font-black uppercase text-xs tracking-widest">Network Secure • No Active Alerts</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REMAINING THE SAME... */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
           <div className="bg-white text-black w-full max-w-2xl rounded-[3rem] p-12 relative shadow-2xl border border-white">
              <button onClick={() => setSelectedAlert(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black"><X/></button>
              <div className="flex items-center gap-4 mb-8 text-red-600">
                 <AlertTriangle size={32} />
                 <h3 className="text-3xl font-black tracking-tighter">Safety Analysis</h3>
              </div>
              <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 mb-10">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Neural Transcript</p>
                 <p className="text-xl font-medium italic leading-relaxed text-gray-800">"{selectedAlert.transcript}"</p>
              </div>
              <div className="flex gap-4">
                 <button className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Contact Law Enforcement</button>
                 <button onClick={() => setSelectedAlert(null)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Dismiss</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;