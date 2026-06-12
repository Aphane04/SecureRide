import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Plus, Eye, X, User, Mail, Phone, 
  MapPin, Fingerprint, Calendar, Car, ShieldCheck, ShieldAlert 
} from 'lucide-react';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  // Your actual Render backend URL for fallback
  const API_BASE_URL = "https://secureride-backend-3enn.onrender.com";

  useEffect(() => {
    adminAPI.drivers().then((res) => {
      setDrivers(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // SMART IMAGE HELPER: Handles both Base64 and legacy file paths
  const renderImage = (imageUrl, placeholderIcon) => {
    if (!imageUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 italic text-[10px]">
          {placeholderIcon}
          <span className="mt-2 uppercase font-black tracking-tighter">No Image</span>
        </div>
      );
    }
    
    // If it's a Base64 string, use directly. If it's a path, add backend URL.
    const finalUrl = imageUrl.startsWith('data:') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
    return <img src={finalUrl} className="w-full h-full object-cover" alt="Identity Document" />;
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans overflow-x-hidden">
      
      {/* 1. Header Section */}
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1 text-white uppercase italic">Driver Management</h2>
            <p className="text-gray-500 text-sm font-medium">{drivers.length} Authorized system operators detected</p>
          </div>
        </div>

        {/* 2. White Table Container */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-100">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Driver Identity</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle Assets</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Registered</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-black font-bold">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center font-black uppercase text-gray-300 animate-pulse">Syncing Encrypted Logs...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center font-black uppercase text-gray-300 italic">No drivers found in registry</td></tr>
              ) : (
                drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                          {renderImage(d.id_photo_url, <User size={20}/>)}
                        </div>
                        <span className="font-black text-sm text-[#1a1a1a]">{d.full_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-xs font-bold text-gray-600">{d.vehicle?.make_model || 'Unassigned'}</p>
                      <p className="text-[10px] text-gray-400 font-medium uppercase">{d.vehicle?.plate_number || '---'}</p>
                    </td>
                    <td className="p-5 text-center">
                      {d.is_verified ? (
                        <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Verified</span>
                      ) : (
                        <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">In Review</span>
                      )}
                    </td>
                    <td className="p-5 text-xs text-gray-400 font-bold uppercase">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-5 text-center">
                        <button 
                          onClick={() => setSelectedDriver(d)}
                          className="bg-[#ede7f6] text-[#5e35b1] px-6 py-2 rounded-full text-[10px] font-black tracking-widest hover:bg-[#5e35b1] hover:text-white transition shadow-sm active:scale-95"
                        >
                          VIEW DATA
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DRIVER DOSSIER MODAL */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-white text-[#1a1a1a] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[700px] border border-white/20">
            
            {/* Left Column: Biometric Evidence */}
            <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-200 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">License / ID Registry</p>
                <div className="aspect-[3/2] bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  {renderImage(selectedDriver.id_photo_url, <Fingerprint size={32}/>)}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Fleet Asset Photo</p>
                <div className="aspect-[3/2] bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  {renderImage(selectedDriver.vehicle?.photo_url, <Car size={32}/>)}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-200">
                 <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${selectedDriver.is_verified ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-orange-500'}`} />
                    <span className="text-xs font-black uppercase tracking-widest">Protocol: {selectedDriver.is_verified ? 'Authorized' : 'Pending'}</span>
                 </div>
              </div>
            </div>

            {/* Right Column: Registry Data */}
            <div className="md:w-2/3 p-12 overflow-y-auto custom-scrollbar relative bg-white">
              <button onClick={() => setSelectedDriver(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-all bg-gray-100 p-2 rounded-full"><X size={20}/></button>

              <h3 className="text-4xl font-black tracking-tighter mb-1 leading-none uppercase italic">{selectedDriver.full_name}</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Authorized Driver Dossier</p>

              <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                <InfoBox label="Full Name" value={selectedDriver.full_name} icon={<User size={12}/>} />
                <InfoBox label="Email Address" value={selectedDriver.email} icon={<Mail size={12}/>} />
                <InfoBox label="ID/Passport" value={selectedDriver.id_number} icon={<Fingerprint size={12}/>} />
                <InfoBox label="Mobile Number" value={selectedDriver.phone} icon={<Phone size={12}/>} />
                <InfoBox label="Home Address" value={selectedDriver.address} icon={<MapPin size={12}/>} />
                <InfoBox label="Registration" value={selectedDriver.created_at ? new Date(selectedDriver.created_at).toLocaleDateString() : 'N/A'} icon={<Calendar size={12}/>} />
              </div>

              {/* Vehicle Asset Card */}
              <div className="mt-12 p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                <h4 className="text-[10px] font-black text-[#5e35b1] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Car size={16}/> Vehicle Registry Details
                </h4>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Make & Model</p>
                        <p className="text-sm font-black text-black">{selectedDriver.vehicle?.make_model || 'Unregistered'}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">License Plate</p>
                        <p className="text-sm font-black text-black uppercase">{selectedDriver.vehicle?.plate_number || '---'}</p>
                    </div>
                </div>
              </div>

              <div className="mt-16 flex gap-4">
                  <button onClick={() => setSelectedDriver(null)} className="bg-black text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Close Dossier</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for clean rendering
const InfoBox = ({ label, value, icon }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2 flex items-center gap-2">
      <span className="text-[#5e35b1]">{icon}</span> {label}
    </span>
    <span className="text-sm font-bold text-gray-950 tracking-tight">{value || '---'}</span>
  </div>
);

export default AdminDrivers;