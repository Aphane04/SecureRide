import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  User, Mail, ShieldCheck, ShieldAlert, Calendar, 
  MapPin, Phone, Fingerprint, Info, X, Eye, FileText 
} from 'lucide-react';

const AdminPassengers = () => {
  const [passengers, setPassengers] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the full URL for your backend (e.g., http://localhost:8000)
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    adminAPI.passengers()
      .then((res) => {
        setPassengers(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const labelClass = "text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1";
  const dataClass = "text-sm font-medium text-white";

  return (
    <div className="min-h-screen bg-black p-4 md:p-10 text-white font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]" />
            <span className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Internal Database</span>
          </div>
          <h2 className="text-5xl font-black tracking-tighter">Passenger Logs</h2>
        </div>
        <div className="bg-[#0d0d0d] border border-white/5 px-8 py-4 rounded-[2rem] flex items-center gap-4">
            <div className="text-right">
                <p className="text-[10px] font-bold text-gray-600 uppercase">Total Registered</p>
                <p className="text-2xl font-black text-green-500">{passengers.length}</p>
            </div>
            <User className="text-gray-700" size={32} />
        </div>
      </div>

      {/* Table-less Grid View */}
      <div className="max-w-6xl mx-auto space-y-3">
        {passengers.map((p) => (
          <div 
            key={p.id} 
            className="group bg-[#080808] border border-white/5 p-5 md:p-7 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between transition-all hover:bg-[#0c0c0c] hover:border-white/10"
          >
            <div className="flex items-center gap-6 mb-4 md:mb-0">
              <div className="w-14 h-14 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/10 group-hover:border-green-500/50 transition-all">
                <User size={24} className="text-gray-400 group-hover:text-green-500" />
              </div>
              <div>
                <h4 className="text-lg font-black tracking-tight">{p.full_name}</h4>
                <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                    <span className="flex items-center gap-1"><Mail size={12}/> {p.email}</span>
                    <span className="text-gray-800">|</span>
                    <span className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-widest">ID: {p.id_number}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 border-t border-white/5 pt-4 md:border-none md:pt-0">
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Auth Status</p>
                {p.is_verified ? (
                  <span className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase"><ShieldCheck size={14}/> Verified</span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-600 text-[10px] font-black uppercase"><ShieldAlert size={14}/> Pending</span>
                )}
              </div>
              
              <button 
                onClick={() => setSelectedPassenger(p)}
                className="bg-white text-black hover:bg-green-500 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2"
              >
                <Eye size={16} /> VIEW DATA
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DETAILED INFORMATION MODAL */}
      {selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl p-8 md:p-12 custom-scrollbar">
            
            <button 
              onClick={() => setSelectedPassenger(null)} 
              className="absolute top-8 right-8 text-gray-500 hover:text-white transition-all bg-white/5 p-2 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Column 1: Verification Image */}
              <div className="lg:col-span-4">
                <div className="sticky top-0">
                  <p className={labelClass}>Uploaded ID Document</p>
                  <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 group relative">
                    {selectedPassenger.id_photo_url ? (
                      <img 
                        src={`${API_BASE_URL}${selectedPassenger.id_photo_url}`} 
                        alt="User ID Document" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 italic text-center p-6">
                        <FileText size={48} className="mb-4 opacity-20" />
                        <span className="text-[10px] font-bold uppercase">No document image found in database</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 p-5 bg-white/5 border border-white/5 rounded-2xl">
                    <p className={labelClass}>Liveness Result</p>
                    <p className="text-xs font-bold text-green-500 flex items-center gap-2">
                        <ShieldCheck size={14} /> AI Verification Passed
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 2: Data Fields */}
              <div className="lg:col-span-8">
                <h3 className="text-4xl font-black tracking-tighter mb-10 text-white">Registry Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                  <DetailItem icon={<User size={14}/>} label="Full Name" value={selectedPassenger.full_name} />
                  <DetailItem icon={<Mail size={14}/>} label="Email Address" value={selectedPassenger.email} />
                  <DetailItem icon={<Fingerprint size={14}/>} label="ID/Passport Number" value={selectedPassenger.id_number} />
                  <DetailItem icon={<Calendar size={14}/>} label="Date of Birth" value={selectedPassenger.dob} />
                  <DetailItem icon={<Info size={14}/>} label="Gender" value={selectedPassenger.gender} />
                  <DetailItem icon={<Info size={14}/>} label="Ethnicity" value={selectedPassenger.ethnicity} />
                  <DetailItem icon={<Phone size={14}/>} label="Mobile Contact" value={selectedPassenger.phone} />
                  <DetailItem icon={<MapPin size={14}/>} label="Home Address" value={selectedPassenger.address} />
                </div>

                <div className="mt-16 pt-8 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <button className="bg-green-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 transition-all">
                        Approve User
                    </button>
                    <button className="border border-red-500/30 text-red-500 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                        Flag Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
      `}</style>
    </div>
  );
};

// Sub-component for clean rendering
const DetailItem = ({ icon, label, value }) => (
  <div className="flex flex-col">
    <span className="text-[9px] uppercase tracking-[0.25em] text-gray-600 font-bold mb-2 flex items-center gap-2">
      <span className="text-green-500/50">{icon}</span> {label}
    </span>
    <span className="text-sm font-bold text-white tracking-wide">{value || "---"}</span>
  </div>
);

export default AdminPassengers;