import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  ShieldAlert, MessageSquare, X, 
  Activity, AlertTriangle, User, Phone, Users, MapPin, Car
} from 'lucide-react';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);

  const loadAlerts = async () => {
    try {
      const res = await adminAPI.alerts();
      setAlerts(res.data);
    } catch (err) {
      console.error("Safety sync failed");
    }
  };

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(loadAlerts, 10000); 
    return () => clearInterval(timer);
  }, []);

  const getSeverity = (transcript) => {
    const t = transcript?.toLowerCase() || "";
    if (['help', 'stop', 'police', 'danger', 'no'].some(word => t.includes(word))) {
        return { label: 'CRITICAL', color: 'bg-red-50 text-red-600', dot: 'bg-red-600' };
    }
    return { label: 'WARNING', color: 'bg-orange-50 text-orange-600', dot: 'bg-orange-600' };
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      <div className="p-8 max-w-[1600px] mx-auto">
        
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-500 font-black">
                <Activity size={16} className="animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em]">Neural Safety Feed</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase">Alert Center</h2>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Level</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Trip Ref</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Transcript</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {alerts.map((a) => {
                const severity = getSeverity(a.transcript);
                return (
                  <tr key={a.id} className="hover:bg-red-50/30 border-b border-gray-50 transition-colors">
                    <td className="p-5">
                        <span className={`${severity.color} px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest flex items-center gap-2 w-fit border border-current`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${severity.dot} animate-pulse`} />
                            {severity.label}
                        </span>
                    </td>
                    <td className="p-5 font-black text-xs">SR-#{a.trip?.id || 'N/A'}</td>
                    <td className="p-5 text-sm font-medium text-gray-600 italic truncate max-w-sm">"{a.transcript}"</td>
                    <td className="p-5 text-center">
                        <button onClick={() => setSelectedAlert(a)} className="bg-black text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md">
                            VIEW DOSSIER
                        </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMERGENCY DOSSIER MODAL */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="bg-white text-black w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-white max-h-[90vh] overflow-y-auto">
            
            <button onClick={() => setSelectedAlert(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={32}/></button>

            <div className="p-12">
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-gray-100">
                <div className="p-4 bg-red-600 text-white rounded-3xl animate-pulse shadow-lg">
                    <ShieldAlert size={32} />
                </div>
                <div>
                    <h3 className="text-4xl font-black tracking-tighter">Emergency Dossier</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">Incident #{selectedAlert.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* LEFT: Transcript & Trip */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MessageSquare size={14}/> AI Voice Transcript
                    </p>
                    <p className="text-2xl font-medium italic leading-relaxed text-red-900">
                        "{selectedAlert?.transcript || 'No transcript data'}"
                    </p>
                  </div>

                  <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <MapPin size={14}/> Route Logistics
                    </p>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Pickup Location</p>
                            <p className="text-sm font-bold">{selectedAlert?.trip?.pickup || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Last Reported Destination</p>
                            <p className="text-sm font-bold">{selectedAlert?.trip?.destination || 'Unknown'}</p>
                        </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: User Profiles */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Passenger</p>
                    <p className="text-lg font-black">{selectedAlert?.passenger?.name || 'Unknown User'}</p>
                    <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2"><Phone size={10}/> {selectedAlert?.passenger?.phone || 'N/A'}</p>
                  </div>

                  <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Car size={12}/> Driver</p>
                    <p className="text-lg font-black">{selectedAlert?.driver?.name || 'Waiting for match...'}</p>
                    <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2"><Phone size={10}/> {selectedAlert?.driver?.phone || 'N/A'}</p>
                  </div>

                  <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl">
                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={12}/> Passenger Emergency Contacts</p>
                    <div className="space-y-4">
                        {selectedAlert?.passenger?.contacts?.length > 0 ? selectedAlert.passenger.contacts.map((c, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-white/10 pb-2 last:border-none">
                                <div>
                                    <p className="text-xs font-bold">{c.name}</p>
                                    <p className="text-[10px] text-gray-500">{c.phone}</p>
                                </div>
                                <a href={`tel:${c.phone}`} className="p-2 bg-white/10 rounded-full hover:bg-red-600 transition-colors">
                                    <Phone size={14} />
                                </a>
                            </div>
                        )) : <p className="text-[10px] text-gray-500 italic uppercase tracking-tighter">No safety contacts registered.</p>}
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-12 flex gap-4">
                 <button className="flex-1 bg-red-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-red-700 transition-all">Dispatch Police</button>
                 <button onClick={() => setSelectedAlert(null)} className="flex-1 bg-gray-100 text-gray-400 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em]">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlerts;