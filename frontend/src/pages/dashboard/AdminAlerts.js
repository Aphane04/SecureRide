import React, { useEffect, useState, useMemo } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, Printer, ArrowDownToLine, X, 
  Activity, AlertTriangle, User, Phone, MapPin, Car, Check, Loader2
} from 'lucide-react';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const res = await adminAPI.alerts();
      if (Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch (err) { 
      console.error("Safety sync failed:", err); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 10000); 
    return () => clearInterval(timer);
  }, []);

  // LOGIC: DEDUPLICATION
  // This ensures that if a trip sends 10 alerts, we only show the LATEST one in the main table.
  // This stops the table from looking like "Spam".
  const uniqueAlerts = useMemo(() => {
    const latestByTrip = {};
    alerts.forEach(alert => {
      const tripId = alert.trip?.id;
      if (!latestByTrip[tripId] || new Date(alert.detected_at) > new Date(latestByTrip[tripId].detected_at)) {
        latestByTrip[tripId] = alert;
      }
    });
    return Object.values(latestByTrip).sort((a, b) => new Date(b.detected_at) - new Date(a.detected_at));
  }, [alerts]);

  const getSeverity = (transcript) => {
    const t = transcript?.toLowerCase() || "";
    // Stronger keywords for Critical
    if (['help', 'stop', 'police', 'danger', 'weapon', 'no no'].some(word => t.includes(word))) {
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
          <div className="text-right">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Alerts</p>
             <p className="text-2xl font-black text-red-600">{uniqueAlerts.length}</p>
          </div>
        </div>

        {/* Registry Table */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 text-black">
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest w-[150px]">Severity</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest w-[180px]">Case Ref</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">Latest AI Transcript</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest text-center w-[200px]">Protocol</th>
              </tr>
            </thead>
            <tbody className="text-black font-bold">
              {loading ? (
                <tr><td colSpan="4" className="p-20 text-center animate-pulse text-gray-400 uppercase text-xs">Syncing Neural Logs...</td></tr>
              ) : uniqueAlerts.length === 0 ? (
                <tr><td colSpan="4" className="p-20 text-center text-gray-400 uppercase text-xs">All Systems Clear • No Active Threats</td></tr>
              ) : (
                uniqueAlerts.map((a) => {
                  const severity = getSeverity(a.transcript);
                  return (
                    <tr key={a.id} className="hover:bg-red-50/50 border-b border-gray-200 transition-colors">
                      <td className="p-6">
                          <span className={`${severity.color} text-[11px] font-black tracking-widest flex items-center gap-2`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${severity.dot} animate-pulse`} />
                              {severity.label}
                          </span>
                      </td>
                      <td className="p-6 font-mono text-xs text-gray-900">#SR-{a.trip?.id}-ALRT-{a.id}</td>
                      <td className="p-6 italic text-sm text-gray-950 font-black">"{a.transcript}"</td>
                      <td className="p-6 text-center">
                          <button 
                              onClick={() => setSelectedAlert(a)}
                              className="bg-black text-white px-8 py-2.5 rounded-xl text-[10px] font-bold tracking-widest hover:bg-red-700 transition-all uppercase shadow-lg active:scale-95"
                          >
                              Open Dossier
                          </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OFFICIAL INCIDENT REPORT MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-white text-black w-full max-w-4xl shadow-2xl relative flex flex-col min-h-[90vh] my-auto overflow-hidden animate-in fade-in zoom-in duration-300 rounded-[2.5rem] border border-white/20">
            
            <div className="p-10 border-b-[6px] border-black flex justify-between items-start bg-gray-100">
                <div>
                    <h3 className="text-xs font-black tracking-[0.3em] uppercase mb-1 text-black">SecureRide Safety Bureau</h3>
                    <div className="mt-8">
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Incident Report</h1>
                        <p className="font-mono text-xs mt-3 text-red-700 font-bold uppercase tracking-widest bg-white px-3 py-1 border border-red-200 inline-block rounded">
                            Case Reference: #SR-ALERT-{selectedAlert.id}
                        </p>
                    </div>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors border border-gray-300 shadow-sm"><X size={24}/></button>
            </div>

            <div className="p-12 flex-1 relative bg-white">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-45deg]"><ShieldAlert size={500} /></div>

                <div className="relative z-10 space-y-16">
                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-4 text-black border-b-2 border-black pb-2">01. Neural Evidence Transcript</h4>
                        <div className="pl-6 border-l-8 border-red-700 bg-red-50 py-10 pr-8 rounded-r-3xl">
                            <p className="text-3xl font-black italic leading-tight text-red-950">"{selectedAlert.transcript}"</p>
                            <p className="mt-6 text-[10px] font-black text-red-700/60 uppercase tracking-widest">Captured via Web Speech Neural API • Time: {new Date(selectedAlert.detected_at).toLocaleTimeString()}</p>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-20">
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">02. Mission Logistics</h4>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Pickup (Origin)</p>
                                    <p className="text-base font-black text-black leading-snug">{selectedAlert.trip?.pickup || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Reported Destination</p>
                                    <p className="text-base font-black text-black leading-snug">{selectedAlert.trip?.destination || 'N/A'}</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">03. Target Identification</h4>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Passenger</p>
                                    <p className="text-xl font-black text-black uppercase">{selectedAlert.passenger?.name || 'Unknown User'}</p>
                                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">{selectedAlert.passenger?.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Active Operator (Driver)</p>
                                    <p className="text-base font-black text-black uppercase">{selectedAlert.driver?.name || 'Unit Unassigned'}</p>
                                    <p className="text-sm font-mono font-bold text-gray-900 mt-1">{selectedAlert.driver?.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">04. Designated Safety Contacts</h4>
                        <div className="grid grid-cols-2 gap-6">
                            {selectedAlert.passenger?.contacts?.map((c, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-50 p-5 border-2 border-black rounded-2xl shadow-sm">
                                    <div>
                                        <p className="text-xs font-black uppercase text-black mb-1">{c.name}</p>
                                        <p className="text-sm font-mono font-black text-gray-600">{c.phone}</p>
                                    </div>
                                    <div className="p-2.5 bg-black text-white rounded-full"><Phone size={18} /></div>
                                </div>
                            )) || <p className="text-[10px] text-gray-400 italic">No protocols found.</p>}
                        </div>
                    </section>
                </div>
            </div>

            <div className="p-10 border-t-4 border-black flex gap-4 bg-gray-100">
                <button className="flex-1 bg-red-700 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-red-800 flex items-center justify-center gap-3 transition-all active:scale-95">
                    <ShieldAlert size={20} /> Dispatch SAPS Emergency Units
                </button>
                <button onClick={() => setSelectedAlert(null)} className="bg-black text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all">Close Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;