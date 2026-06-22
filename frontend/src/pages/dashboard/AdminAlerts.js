import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, Printer, ArrowDownToLine, X, 
  Activity, AlertTriangle, User, Phone, MapPin, 
  Car, Check, FileText, CheckCircle2, Clock, RotateCcw, Download
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

  const handleToggleResolve = async (id) => {
    try {
      // Logic: This hits the backend to update is_resolved status
      await adminAPI.resolveAlert(id);
      loadAlerts(); 
    } catch (err) { alert("Action failed."); }
  };

  // NEW: Function to generate and download the report as a file
  const downloadReportFile = (alertData) => {
    const reportContent = `
SECURE-RIDE SAFETY BUREAU - INCIDENT REPORT
==========================================
CASE REFERENCE: #SR-ALERT-${alertData.id}
TIMESTAMP: ${new Date(alertData.detected_at).toLocaleString()}
STATUS: ${alertData.is_resolved ? 'RESOLVED' : 'ACTIVE INVESTIGATION'}

01. NEURAL EVIDENCE TRANSCRIPT
------------------------------
"${alertData.transcript}"

02. MISSION LOGISTICS
------------------------------
TRIP ID: #SR-${alertData.trip?.id}
PICKUP: ${alertData.trip?.pickup}
DESTINATION: ${alertData.trip?.destination}

03. TARGET IDENTIFICATION
------------------------------
PASSENGER: ${alertData.passenger?.name}
PHONE: ${alertData.passenger?.phone}
DRIVER: ${alertData.driver?.name}

04. EMERGENCY CONTACTS
------------------------------
${alertData.passenger?.contacts?.map(c => `- ${c.name}: ${c.phone}`).join('\n') || 'None Registered'}

END OF REPORT
    `;

    const element = document.createElement("a");
    const file = new Blob([reportContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `SecureRide_Incident_${alertData.id}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const getSeverity = (transcript) => {
    const t = transcript?.toLowerCase() || "";
    if (['help', 'stop', 'police', 'danger', 'no'].some(word => t.includes(word))) {
        return { label: 'CRITICAL', color: 'text-red-700', dot: 'bg-red-700' };
    }
    return { label: 'WARNING', color: 'text-orange-700', dot: 'bg-orange-700' };
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black font-sans selection:bg-red-500">
      <div className="p-8 max-w-[1500px] mx-auto no-print">
        
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-500 font-bold">
                <Activity size={16} className="animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.4em]">Safety Intelligence Bureau</span>
            </div>
            <h2 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">Incident Registry</h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">Case ID</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">Severity</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest">Transcript</th>
                <th className="p-6 text-[11px] font-black text-gray-700 uppercase tracking-widest text-center">System Actions</th>
              </tr>
            </thead>
            <tbody className="text-black font-bold">
              {alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className={`border-b border-gray-200 transition-colors ${a.is_resolved ? 'bg-gray-50 opacity-40' : 'hover:bg-gray-50'}`}>
                    <td className="p-6 font-mono text-xs text-gray-900 font-black">#SR-{a.trip?.id}</td>
                    <td className="p-6">
                        <span className={`${severity.color} text-[11px] font-black tracking-widest flex items-center gap-2`}>
                            <div className={`w-2 h-2 rounded-full ${severity.dot}`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-6 italic text-sm text-black">"{a.transcript}"</td>
                    
                    <td className="p-6">
                        <div className="flex items-center justify-center gap-2">
                            {/* ACTION: RESOLVE BUTTON IN TABLE */}
                            <button 
                                onClick={() => handleToggleResolve(a.id)}
                                title={a.is_resolved ? "Reopen Case" : "Resolve Case"}
                                className={`p-2 rounded-lg transition-all ${a.is_resolved ? 'bg-gray-200 text-gray-400 hover:text-black' : 'bg-green-100 text-green-700 hover:bg-green-600 hover:text-white'}`}
                            >
                                {a.is_resolved ? <RotateCcw size={16} /> : <Check size={16} />}
                            </button>

                            <button 
                                onClick={() => setSelectedAlert(a)}
                                className="bg-black text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest hover:bg-red-700 transition-all uppercase"
                            >
                                Open Dossier
                            </button>
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* THE OFFICIAL REPORT MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="bg-white text-black w-full max-w-4xl shadow-2xl relative flex flex-col min-h-[90vh] my-auto overflow-hidden rounded-3xl border-[8px] border-black">
            
            <div className="p-10 border-b-[6px] border-black flex justify-between items-start bg-gray-100">
                <div>
                    <h3 className="text-xs font-black tracking-[0.3em] uppercase mb-1 text-black">SecureRide Safety Bureau</h3>
                    <div className="mt-8 flex items-end gap-6">
                        <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Incident Report</h1>
                        {selectedAlert.is_resolved && (
                             <div className="bg-green-600 text-white px-4 py-1 rounded-md flex items-center gap-2 mb-1">
                                <CheckCircle2 size={16} strokeWidth={4}/>
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
                        <div className={`pl-6 border-l-8 py-10 pr-8 rounded-r-2xl ${selectedAlert.is_resolved ? 'border-green-600 bg-green-50' : 'border-red-700 bg-red-50'}`}>
                            <p className="text-4xl font-black italic leading-tight text-black">"{selectedAlert.transcript}"</p>
                            <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(selectedAlert.detected_at).toLocaleString()}</p>
                        </div>
                    </section>

                    <div className="grid grid-cols-2 gap-20">
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">02. Mission Logistics</h4>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Starting Point (Pickup)</p><p className="text-base font-black text-black">{selectedAlert.trip?.pickup}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Last Logged Destination</p><p className="text-base font-black text-black">{selectedAlert.trip?.destination}</p></div>
                            </div>
                        </section>
                        <section>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">03. Target Identification</h4>
                            <div className="space-y-6">
                                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Passenger Name</p><p className="text-xl font-black text-black uppercase">{selectedAlert.passenger?.name}</p></div>
                                <div><p className="text-[10px] font-black uppercase text-gray-400 mb-1">Active Operator (Driver)</p><p className="text-base font-black text-black uppercase">{selectedAlert.driver?.name || 'Searching...'}</p></div>
                            </div>
                        </section>
                    </div>

                    <section>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.4em] mb-6 text-black border-b-2 border-black pb-2">04. Contact Protocols</h4>
                        <div className="grid grid-cols-2 gap-6">
                            {selectedAlert.passenger?.contacts?.map((c, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-100 p-5 border-2 border-black rounded-xl">
                                    <p className="text-xs font-black uppercase text-black">{c.name}: {c.phone}</p>
                                    <Phone size={16} />
                                </div>
                            )) || <p className="text-[10px] text-gray-400 italic">No protocols found.</p>}
                        </div>
                    </section>
                </div>
            </div>

            <div className="p-10 border-t-4 border-black flex gap-4 bg-gray-100">
                {/* PRIMARY ACTION: DOWNLOAD FILE */}
                <button 
                    onClick={() => downloadReportFile(selectedAlert)}
                    className="flex-1 bg-black text-white py-5 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-[#008751] flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <Download size={20} /> Download Report File (.txt)
                </button>
                
               {/* <button className="bg-red-700 text-white px-10 py-5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-800 flex items-center gap-3">
                    <ShieldAlert size={20} /> Dispatch SAPS
                </button>*/}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;