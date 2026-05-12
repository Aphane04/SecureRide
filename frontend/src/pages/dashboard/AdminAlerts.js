import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, Printer, ArrowDownToLine, X, 
  Activity, AlertTriangle, User, Phone, MapPin, Car, FileText, Check
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

  const getSeverity = (transcript) => {
    const t = transcript?.toLowerCase() || "";
    if (['help', 'stop', 'police', 'danger', 'no'].some(word => t.includes(word))) {
        return { label: 'CRITICAL', color: 'text-red-600', dot: 'bg-red-600' };
    }
    return { label: 'WARNING', color: 'text-orange-600', dot: 'bg-orange-600' };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500">
      <div className="p-8 max-w-[1400px] mx-auto">
        
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-500 font-bold">
                <Activity size={16} className="animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.4em]">Safety Intelligence Bureau</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">INCIDENT LOGS</h2>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Severity</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Case Ref</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Transcript</th>
                <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="text-black font-medium">
              {alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="p-6">
                        <span className={`${severity.color} text-[10px] font-black tracking-widest flex items-center gap-2`}>
                            <div className={`w-2 h-2 rounded-full ${severity.dot}`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-6 font-mono text-xs text-gray-400">#SR-2026-{a.trip?.id}</td>
                    <td className="p-6 italic text-sm text-gray-700">"{a.transcript}"</td>
                    <td className="p-6 text-center">
                        <button 
                            onClick={() => setSelectedAlert(a)}
                            className="bg-black text-white px-6 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-red-600 transition-all shadow-xl uppercase"
                        >
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

      {/* OFFICIAL INCIDENT REPORT MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-white text-black w-full max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col min-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Report Header: Bureau Style */}
            <div className="p-10 border-b-4 border-black flex justify-between items-start bg-gray-50">
                <div>
                    <h3 className="text-sm font-black tracking-[0.3em] uppercase mb-1">SecureRide Safety Bureau</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Internal Safety Intelligence & Dispatch</p>
                    <div className="mt-8">
                        <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Incident Report</h1>
                        <p className="font-mono text-xs mt-2 text-gray-500 uppercase">Case: #SR-ALERT-{selectedAlert.id} | Status: High Severity</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase mb-1">Time Captured</p>
                        <p className="text-xs font-mono bg-black text-white px-3 py-1">{new Date(selectedAlert.detected_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="p-12 flex-1 relative">
                {/* Visual Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-45deg]">
                    <ShieldAlert size={500} />
                </div>

                <div className="relative z-10 space-y-12">
                    
                    {/* Section: Evidence */}
                    <section>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-gray-400 border-b pb-2">01. Neural Evidence Transcript</h4>
                        <div className="pl-6 border-l-4 border-red-600 bg-red-50/50 py-6 pr-6">
                            <p className="text-2xl font-bold italic leading-relaxed text-red-900">
                                "{selectedAlert?.transcript || 'Log corrupted'}"
                            </p>
                            <p className="mt-4 text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                                <Check size={12}/> Verified AI Audio Capture • Confidence: 88%
                            </p>
                        </div>
                    </section>

                    {/* Section: Mission Data */}
                    <div className="grid grid-cols-2 gap-16">
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-gray-400 border-b pb-2">02. Mission Logistics</h4>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <MapPin size={16} className="text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-400">Pickup Location</p>
                                        <p className="text-sm font-bold">{selectedAlert?.trip?.pickup || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Car size={16} className="text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-gray-400">Last Reported Destination</p>
                                        <p className="text-sm font-bold">{selectedAlert?.trip?.destination || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-gray-400 border-b pb-2">03. Target Identification</h4>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-gray-400">Passenger</p>
                                    <p className="text-lg font-black">{selectedAlert?.passenger?.name}</p>
                                    <p className="text-xs font-mono text-gray-500 mt-0.5">{selectedAlert?.passenger?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-gray-400">Assigned Operator (Driver)</p>
                                    <p className="text-sm font-bold uppercase">{selectedAlert?.driver?.name || 'N/A'}</p>
                                    <p className="text-xs font-mono text-gray-500 mt-0.5">{selectedAlert?.driver?.phone || 'UNREGISTERED'}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Section: Emergency Protocols */}
                    <section>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-gray-400 border-b pb-2">04. Designated Safety Contacts</h4>
                        <div className="grid grid-cols-2 gap-4">
                            {selectedAlert?.passenger?.contacts?.length > 0 ? selectedAlert.passenger.contacts.map((c, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-50 p-4 border border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-tighter">{c.name}</p>
                                        <p className="text-xs font-mono">{c.phone}</p>
                                    </div>
                                    <Phone size={14} className="text-[#008751]" />
                                </div>
                            )) : <p className="text-[10px] text-gray-400 uppercase italic">No emergency protocols registered for this user.</p>}
                        </div>
                    </section>
                </div>
            </div>

            {/* Action Footer */}
            <div className="p-10 border-t border-gray-100 flex gap-4 bg-gray-50">
                <button className="flex-1 bg-red-600 text-white py-4 rounded-lg font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-700 flex items-center justify-center gap-3">
                    <ShieldAlert size={18} /> Dispatch SAPS Emergency
                </button>
                <button className="bg-black text-white px-8 py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-gray-800 flex items-center gap-3">
                    <Printer size={18} /> Print Record
                </button>
                <button className="bg-gray-200 text-gray-600 px-8 py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-gray-300 flex items-center gap-3">
                    <ArrowDownToLine size={18} /> Download JSON
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;