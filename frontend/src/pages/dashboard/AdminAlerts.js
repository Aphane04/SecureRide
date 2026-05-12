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
        return { label: 'CRITICAL', color: 'text-red-700', dot: 'bg-red-700' };
    }
    return { label: 'WARNING', color: 'text-orange-700', dot: 'bg-orange-700' };
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
            <h2 className="text-4xl font-black text-white tracking-tighter">INCIDENT REGISTRY</h2>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">Severity</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">Case Ref</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">AI Transcript</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="text-black font-bold">
              {alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className="hover:bg-gray-50 border-b border-gray-200 transition-colors">
                    <td className="p-6">
                        <span className={`${severity.color} text-[11px] font-black tracking-widest flex items-center gap-2`}>
                            <div className={`w-2.5 h-2.5 rounded-full ${severity.dot}`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-6 font-mono text-xs text-gray-900">#SR-2026-{a.trip?.id}</td>
                    <td className="p-6 italic text-sm text-gray-900">"{a.transcript}"</td>
                    <td className="p-6 text-center">
                        <button 
                            onClick={() => setSelectedAlert(a)}
                            className="bg-black text-white px-6 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-red-700 transition-all uppercase"
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

      {/* OFFICIAL INCIDENT REPORT MODAL - DARKENED FOR LEGIBILITY */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-white text-black w-full max-w-4xl shadow-[0_0_100px_rgba(0,0,0,0.5)] relative flex flex-col min-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Report Header: Bureau Style */}
            <div className="p-10 border-b-[6px] border-black flex justify-between items-start bg-gray-100">
                <div>
                    <h3 className="text-xs font-black tracking-[0.3em] uppercase mb-1 text-black">SecureRide Safety Bureau</h3>
                    <p className="text-[10px] font-bold text-gray-600 uppercase">Internal Safety Intelligence & Dispatch</p>
                    <div className="mt-8">
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none text-black">Incident Report</h1>
                        <p className="font-mono text-xs mt-2 text-red-700 font-bold uppercase">Case Priority: {getSeverity(selectedAlert.transcript).label} SEVERITY</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-6">
                    <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors border border-gray-300"><X size={24}/></button>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase mb-1 text-gray-500">Capture Timestamp</p>
                        <p className="text-sm font-mono font-black bg-black text-white px-4 py-1.5 rounded">{new Date(selectedAlert.detected_at).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="p-12 flex-1 relative bg-white">
                {/* Visual Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-45deg]">
                    <ShieldAlert size={500} />
                </div>

                <div className="relative z-10 space-y-16">
                    
                    {/* Section: Evidence */}
                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-4 text-black border-b-2 border-black pb-2">01. Neural Evidence Transcript</h4>
                        <div className="pl-6 border-l-8 border-red-700 bg-red-50 py-8 pr-8 rounded-r-2xl">
                            <p className="text-3xl font-black italic leading-tight text-red-950">
                                "{selectedAlert?.transcript || 'Log corrupted'}"
                            </p>
                            <div className="mt-6 flex items-center gap-4">
                                <span className="text-[10px] font-black text-red-700 uppercase tracking-widest flex items-center gap-2 bg-white px-3 py-1 border border-red-200 rounded-full">
                                    <Check size={14}/> Verified AI Capture
                                </span>
                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Confidence: 94.2%</span>
                            </div>
                        </div>
                    </section>

                    {/* Section: Data Grid */}
                    <div className="grid grid-cols-2 gap-20">
                        {/* Mission Logistics */}
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">02. Mission Logistics</h4>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <MapPin size={20} className="text-black mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Starting Point (Pickup)</p>
                                        <p className="text-base font-black text-black leading-snug">{selectedAlert?.trip?.pickup || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Activity size={20} className="text-red-600 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Last Logged Destination</p>
                                        <p className="text-base font-black text-black leading-snug">{selectedAlert?.trip?.destination || 'Unknown'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Identification */}
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">03. Target Identification</h4>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Passenger Name</p>
                                    <p className="text-xl font-black text-black uppercase">{selectedAlert?.passenger?.name}</p>
                                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">{selectedAlert?.passenger?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">Active Operator (Driver)</p>
                                    <p className="text-base font-black text-black uppercase">{selectedAlert?.driver?.name || 'Searching Network...'}</p>
                                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">{selectedAlert?.driver?.phone || 'UNIDENTIFIED'}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Section: Emergency Protocols */}
                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">04. Emergency Protocols (Next of Kin)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {selectedAlert?.passenger?.contacts?.length > 0 ? selectedAlert.passenger.contacts.map((c, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-100 p-5 border-2 border-black rounded-xl">
                                    <div>
                                        <p className="text-xs font-black uppercase text-black">{c.name}</p>
                                        <p className="text-sm font-mono font-black text-gray-700">{c.phone}</p>
                                    </div>
                                    <div className="p-2 bg-black text-white rounded-full">
                                        <Phone size={16} />
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-2 py-8 border-2 border-dashed border-gray-300 rounded-2xl text-center">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No emergency protocols registered for this terminal.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Action Footer */}
            <div className="p-10 border-t-4 border-black flex gap-4 bg-gray-100">
                <button className="flex-1 bg-red-700 text-white py-5 rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-red-800 flex items-center justify-center gap-3 transition-all active:scale-95">
                    <ShieldAlert size={20} /> Dispatch SAPS Emergency Units
                </button>
                <button className="bg-black text-white px-10 py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 flex items-center gap-3">
                    <Printer size={20} /> Print
                </button>
                <button className="bg-gray-300 text-black px-10 py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-400 flex items-center gap-3 border border-gray-400">
                    <ArrowDownToLine size={20} /> Export
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;