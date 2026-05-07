import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, Search, Filter, Download, MessageSquare, 
  Clock, Map, Eye, X, Activity, AlertTriangle, FileText 
} from 'lucide-react';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    adminAPI.alerts().then((res) => setAlerts(res.data));
  }, []);

  // Helper to determine severity color based on transcript content
  const getSeverity = (transcript) => {
    const t = transcript.toLowerCase();
    if (t.includes('help') || t.includes('stop') || t.includes('weapon') || t.includes('danger')) {
        return { label: 'CRITICAL', color: 'bg-red-50 text-red-600', dot: 'bg-red-600' };
    }
    return { label: 'WARNING', color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-600' };
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      
      {/* 1. Header Section */}
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Live Safety Feed</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-1 text-white">Alert Center</h2>
            <p className="text-gray-500 text-sm font-medium">AI monitoring active on {alerts.length} historical logs</p>
          </div>
          
          <div className="flex gap-3">
             <button className="bg-white/5 border border-white/10 text-gray-400 px-6 py-2.5 rounded-full text-xs font-black hover:bg-white/10 transition-all flex items-center gap-2">
                <ShieldAlert size={16} /> CLEAR RESOLVED
             </button>
             <button className="bg-red-600 text-white px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 shadow-lg shadow-red-900/20">
                <AlertTriangle size={16} /> EMERGENCY PROTOCOLS
             </button>
          </div>
        </div>

        {/* 2. Filter Bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#1a1a1a] border border-white/5 px-5 py-2.5 rounded-full flex items-center gap-3 cursor-pointer">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity</span>
            <Filter size={14} className="text-gray-600" />
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-4 top-2.5 text-gray-600" size={16} />
            <input 
                type="text" 
                placeholder="Search trip ID..." 
                className="bg-[#1a1a1a] border border-white/5 pl-12 pr-6 py-2.5 rounded-full text-xs text-white w-64 outline-none focus:border-red-500/50 transition-all"
            />
          </div>
        </div>

        {/* 3. The White Table Container */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Severity</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trip Ref</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">AI Detection Log</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Timestamp</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="p-5">
                        <span className={`${severity.color} px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 w-fit`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${severity.dot} animate-pulse`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Map size={14}/></div>
                            <span className="font-black text-xs text-[#1a1a1a]">TRIP-ID: #{a.trip_id}</span>
                        </div>
                    </td>
                    <td className="p-5">
                        <p className="text-sm font-medium text-gray-600 max-w-md truncate italic">
                            "{a.transcript}"
                        </p>
                    </td>
                    <td className="p-5 text-center text-[11px] font-bold text-gray-400">
                        {new Date(a.detected_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-5 text-center">
                        <button 
                            onClick={() => setSelectedAlert(a)}
                            className="bg-[#ede7f6] text-[#5e35b1] px-6 py-2 rounded-full text-[10px] font-black tracking-widest hover:bg-[#5e35b1] hover:text-white transition shadow-sm active:scale-95"
                        >
                            VIEW LOG
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {alerts.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4"><ShieldAlert size={40} className="text-gray-200"/></div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">All safety systems clear</p>
            </div>
          )}
        </div>
      </div>

      {/* SAFETY INTELLIGENCE MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-[#1a1a1a] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white">
            
            <button onClick={() => setSelectedAlert(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors">
              <X size={24} />
            </button>

            <div className="p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h3 className="text-3xl font-black tracking-tighter">Safety Dossier</h3>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Incident Reference #{selectedAlert.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-12">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Map size={12}/> Trip Reference</p>
                  <p className="text-sm font-bold">SecureRide Trip #{selectedAlert.trip_id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={12}/> Detection Time</p>
                  <p className="text-sm font-bold">{new Date(selectedAlert.detected_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[2rem] p-8 border border-gray-100 mb-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MessageSquare size={14}/> AI Voice Transcript
                </p>
                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-200 rounded-full" />
                    <p className="pl-6 text-base font-medium italic text-gray-800 leading-relaxed">
                        "{selectedAlert.transcript}"
                    </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button className="bg-red-600 text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-red-700 transition">Contact Emergency Services</button>
                <button className="bg-black text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition">Flag as False Positive</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;