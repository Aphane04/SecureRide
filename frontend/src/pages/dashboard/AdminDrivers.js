import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Search, Plus, Download, Eye, X, User, Mail, Phone, 
  MapPin, Fingerprint, Calendar, Car, ShieldCheck, ShieldAlert 
} from 'lucide-react';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIX: This matches your Render backend URL
  const API_BASE_URL = "https://secureride-backend-3enn.onrender.com";

  useEffect(() => {
    adminAPI.drivers().then((res) => {
      setDrivers(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // SMART IMAGE HELPER: Ensures Base64 and File Paths both work
  const renderImage = (imageUrl, placeholderIcon) => {
    if (!imageUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300 italic text-[10px]">
          {placeholderIcon}
          <span className="mt-2">No Image</span>
        </div>
      );
    }
    
    // If it's a Base64 string (starts with data:), use it directly.
    // If it's a file path (starts with /uploads), add the backend URL.
    const finalUrl = imageUrl.startsWith('data:') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
    return <img src={finalUrl} className="w-full h-full object-cover" alt="Registry" />;
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans">
      
      {/* 1. Header */}
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1 text-white">Driver Management</h2>
            <p className="text-gray-500 text-sm font-medium">{drivers.length} Authorized fleet operators</p>
          </div>
         {/*} <button className="bg-[#b39ddb] hover:bg-[#9575cd] text-[#1a1a1a] px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 transition-all">
            <Plus size={16} /> ADD NEW DRIVER
          </button>*/}
        </div>

        {/* 2. White Table */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Driver Identity</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Vehicle Assigned</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Verification</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">Applied</th>
                <th className="p-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {loading ? (
                <tr><td colSpan="6" className="p-20 text-center font-black uppercase text-gray-300 animate-pulse">Syncing encrypted records...</td></tr>
              ) : drivers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        {renderImage(d.id_photo_url, <User size={20}/>)}
                      </div>
                      <span className="font-black text-sm text-[#1a1a1a]">{d.full_name}</span>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="text-xs font-bold text-gray-600">{d.vehicle?.make_model || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{d.vehicle?.plate_number || '---'}</p>
                  </td>
                  <td className="p-5 text-center">
                    {d.is_verified ? (
                      <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Selected</span>
                    ) : (
                      <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">In Review</span>
                    )}
                  </td>
                  <td className="p-5 text-xs text-gray-500 font-medium">{d.email}</td>
                  <td className="p-5 text-xs text-gray-400 font-bold">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="p-5">
                    <div className="flex items-center justify-center gap-2">
                     {/* <button className="bg-[#e8f5e9] text-[#2e7d32] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest hover:bg-[#2e7d32] hover:text-white transition">NOTES</button>*/}
                      <button 
                        onClick={() => setSelectedDriver(d)}
                        className="bg-[#ede7f6] text-[#5e35b1] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest hover:bg-[#5e35b1] hover:text-white transition"
                      >
                        VIEW
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DRIVER DOSSIER MODAL */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-[#1a1a1a] w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[700px] border border-white/20">
            
            {/* Left Column: Photos */}
            <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">License / ID Document</p>
                <div className="aspect-[3/2] bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  {renderImage(selectedDriver.id_photo_url, <Fingerprint size={32}/>)}
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Vehicle Photography</p>
                <div className="aspect-[3/2] bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                  {renderImage(selectedDriver.vehicle?.photo_url, <Car size={32}/>)}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-gray-200">
                 <div className="flex items-center gap-3 text-[#008751]">
                    <ShieldCheck size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">Protocol: {selectedDriver.is_verified ? 'Authorized' : 'Pending'}</span>
                 </div>
              </div>
            </div>

            {/* Right Column: Information */}
            <div className="md:w-2/3 p-12 overflow-y-auto custom-scrollbar relative">
              <button onClick={() => setSelectedDriver(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors">
                <X size={24} />
              </button>

              <h3 className="text-4xl font-black tracking-tighter mb-1 leading-none">{selectedDriver.full_name}</h3>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-10">SecureRide Fleet Management</p>

              <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                <InfoBox label="Full Name" value={selectedDriver.full_name} icon={<User size={12}/>} />
                <InfoBox label="Email Address" value={selectedDriver.email} icon={<Mail size={12}/>} />
                <InfoBox label="ID/License Number" value={selectedDriver.id_number} icon={<Fingerprint size={12}/>} />
                <InfoBox label="Phone Number" value={selectedDriver.phone} icon={<Phone size={12}/>} />
                <InfoBox label="Home Address" value={selectedDriver.address} icon={<MapPin size={12}/>} />
                <InfoBox label="Registry Date" value={new Date(selectedDriver.created_at).toLocaleDateString()} icon={<Calendar size={12}/>} />
              </div>

              {/* Vehicle Asset Card */}
              <div className="mt-12 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                <h4 className="text-[10px] font-black text-[#5e35b1] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Car size={14}/> Vehicle Assets
                </h4>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Make & Model</p>
                        <p className="text-sm font-black">{selectedDriver.vehicle?.make_model || 'Unregistered'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">License Plate</p>
                        <p className="text-sm font-black">{selectedDriver.vehicle?.plate_number || '---'}</p>
                    </div>
                </div>
              </div>

              {/*<div className="mt-12 flex gap-4">
                <button className="bg-[#5e35b1] text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#4527a0] transition">Authorize Driver</button>
                <button className="border border-red-100 text-red-500 px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-50 transition">Reject Request</button>
              </div>*/}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoBox = ({ label, value, icon }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
      <span className="text-[#9575cd]">{icon}</span> {label}
    </span>
    <span className="text-sm font-bold text-gray-800">{value || '---'}</span>
  </div>
);

export default AdminDrivers;