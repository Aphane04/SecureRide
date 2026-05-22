import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, Printer, ArrowDownToLine, X, 
  Activity, AlertTriangle, User, Phone, MapPin, 
  Car, Check, Loader2, CheckCircle2, Clock 
} from 'lucide-react';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const loadAlerts = async () => {
    try {
      const res = await adminAPI.alerts();
      setAlerts(res.data);
    } catch (err) { console.error("Safety sync failed"); }
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 10000); 
    return () => clearInterval(timer);
  }, []);

  const handleResolve = async (id) => {
    try {
      await adminAPI.resolveAlert(id);
      setSelectedAlert(null); // Close modal
      loadAlerts(); // Refresh list
    } catch (err) { alert("Failed to update status."); }
  };

  const getSeverity = (transcript) => {
    const t = transcript?.toLowerCase() || "";
    if (['help', 'stop', 'police', 'danger', 'no'].some(word => t.includes(word))) {
        return { label: 'CRITICAL', color: 'text-red-700', dot: 'bg-red-700' };
    }
    return { label: 'WARNING', color: 'text-orange-700', dot: 'bg-orange-700' };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500">
      <div className="p-8 max-w-[1400px] mx-auto no-print">
        
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-500 font-bold">
                <Activity size={16} className="animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.4em]">Safety Intelligence Bureau</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Incident Registry</h2>
          </div>
          <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex gap-8">
             <div className="text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase">Pending</p>
                <p className="text-xl font-black text-red-600">{alerts.filter(a => !a.is_resolved).length}</p>
             </div>
             <div className="text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase">Resolved</p>
                <p className="text-xl font-black text-green-500">{alerts.filter(a => a.is_resolved).length}</p>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-6 text-[10px] font-black text-gray-700 uppercase tracking-widest">Status</th>
                <th className="p-6 text-[10px] font-black text-gray-700 uppercase tracking-widest">Severity</th>
                <th className="p-6 text-[10px] font-black text-gray-700 uppercase tracking-widest">Case Ref</th>
                <th className="p-6 text-[10px] font-black text-gray-700 uppercase tracking-widest">AI Transcript</th>
                <th className="p-6 text-[10px] font-black text-gray-700 uppercase tracking-widest text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="text-black font-bold">
              {alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className={`border-b border-gray-200 transition-colors ${a.is_resolved ? 'bg-gray-50/50 opacity-60' : 'hover:bg-gray-50'}`}>
                    <td className="p-6">
                        {a.is_resolved ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 size={18} />
                                <span className="text-[9px] font-black uppercase">Solved</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <Clock size={18} className="animate-pulse" />
                                <span className="text-[9px] font-black uppercase">Pending</span>
                            </div>
                        )}
                    </td>
                    <td className="p-6">
                        <span className={`${severity.color} text-[10px] font-black tracking-widest flex items-center gap-2`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${severity.dot}`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-6 font-mono text-xs text-gray-900">#SR-2026-{a.trip?.id}</td>
                    <td className="p-6 italic text-sm text-gray-900">"{a.transcript}"</td>
                    <td className="p-6 text-center">
                        <button onClick={() => setSelectedAlert(a)} className="bg-black text-white px-6 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-red-700 transition-all uppercase">
                            Open Dossier
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORT MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-white text-black w-full max-w-4xl shadow-2xl relative flex flex-col min-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in duration-300 rounded-3xl border-8 border-black">
            
            <div className="p-10 border-b-[6px] border-black flex justify-between items-start bg-gray-100">
                <div>
                    <h3 className="text-xs font-black tracking-[0.3em] uppercase mb-1">SecureRide Safety Bureau</h3>
                    <div className="mt-8 flex items-end gap-6">
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Incident Report</h1>
                        {selectedAlert.is_resolved && (
                             <div className="bg-green-600 text-white px-4 py-1 rounded-md flex items-center gap-2 mb-1">
                                <Check size={16} strokeWidth={4}/>
                                <span className="text-[10px] font-black uppercase tracking-widest">Case Resolved</span>
                             </div>
                        )}
                    </div>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="no-print p-2 hover:bg-gray-200 rounded-full border border-gray-300"><X size={24}/></button>
            </div>

            <div className="p-12 flex-1 relative bg-white">
                <div className="relative z-10 space-y-16">
                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-4 text-black border-b-2 border-black pb-2">01. Neural Evidence Transcript</h4>
                        <div className={`pl-6 border-l-8 py-8 pr-8 rounded-r-2xl ${selectedAlert.is_resolved ? 'border-green-600 bg-green-50' : 'border-red-700 bg-red-50'}`}>
                            <p className="text-3xl font-black italic leading-tight">"{selectedAlert.transcript}"</p>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-20">
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">02. Mission Logistics</h4>
                            <div className="space-y-4">
                                <div><p className="text-[10px] font-black uppercase text-gray-500 mb-1">Pickup</p><p className="text-base font-black">{selectedAlert.trip?.pickup}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-gray-500 mb-1">Destination</p><p className="text-base font-black">{selectedAlert.trip?.destination}</p></div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">03. Identification</h4>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase text-gray-500 mb-1">Passenger</p><p className="text-xl font-black">{selectedAlert.passenger?.name}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-gray-500 mb-1">Driver</p><p className="text-base font-black">{selectedAlert.driver?.name}</p></div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="no-print p-10 border-t-4 border-black flex gap-4 bg-gray-100">
                {!selectedAlert.is_resolved ? (
                    <button 
                        onClick={() => handleResolve(selectedAlert.id)}
                        className="flex-1 bg-green-600 text-white py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-green-700 flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <CheckCircle2 size={20} /> Mark Incident as Solved
                    </button>
                ) : (
                    <button className="flex-1 bg-gray-300 text-gray-500 py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] cursor-not-allowed flex items-center justify-center gap-3">
                        <Check size={20} /> Incident Closed
                    </button>
                )}
                
                <button className="bg-red-700 text-white px-10 py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-800 flex items-center gap-3">
                    <ShieldAlert size={20} /> Dispatch SAPS
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;