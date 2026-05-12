import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Search, Plus, ChevronDown, 
  Download, Eye, X, User, Mail, 
  Phone, MapPin, Fingerprint, Calendar, Clock
} from 'lucide-react';

const AdminPassengers = () => {
  const [passengers, setPassengers] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.passengers().then((res) => {
      setPassengers(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // FIX: This helper ensures images show up whether they are Base64 OR file paths
  const renderImage = (imageUrl) => {
    if (!imageUrl) return <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400"><User size={20}/></div>;
    // If it's a Base64 string, use it directly. If it's a path, add the backend URL.
    const finalUrl = imageUrl.startsWith('data:') ? imageUrl : `https://secureride-backend-3enn.onrender.com${imageUrl}`;
    return <img src={finalUrl} className="w-full h-full object-cover" alt="ID" />;
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white font-sans overflow-x-hidden">
      
      {/* 1. Header Section */}
      <div className="p-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">Passengers</h2>
            <p className="text-gray-500 text-sm font-medium">{passengers.length} Total registered passengers</p>
          </div>
          {/*<button className="bg-[#b39ddb] hover:bg-[#9575cd] text-[#1a1a1a] px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 transition-all shadow-lg">
            <Plus size={16} /> ADD NEW LOGIC TO THIS BUTTON IN FUTURE
          </button>*/}
        </div>

        {/* 2. Filter Bar */}
       {/* <div className="flex items-center gap-3 mb-8">
          <FilterDropdown label="Status" />
          <FilterDropdown label="Account Type" />
          <FilterDropdown label="Gender" />
          <div className="flex-1" />
          <button className="p-2 text-gray-500 hover:text-white"><Search size={20}/></button>
          <button className="p-2 text-gray-500 hover:text-white"><Download size={20}/></button>
        </div>*/}

        {/* 3. The White Table Container */}
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Passenger Name</th>
                <th className="p-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                <th className="p-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="p-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobile Number</th>
                <th className="p-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Registered</th>
                <th className="p-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-gray-800">
              {loading ? (
                <tr><td colSpan="6" className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Syncing Database...</td></tr>
              ) : passengers.length === 0 ? (
                <tr><td colSpan="6" className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest italic">No data found in current terminal</td></tr>
              ) : (
                passengers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-100 flex items-center justify-center">
                          {renderImage(p.id_photo_url)}
                        </div>
                        <span className="font-bold text-sm">{p.full_name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      {p.is_verified ? (
                        <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Verified</span>
                      ) : (
                        <span className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Pending</span>
                      )}
                    </td>
                    <td className="p-5 text-sm text-gray-500">{p.email}</td>
                    <td className="p-5 text-sm text-gray-500">{p.phone}</td>
                    <td className="p-5 text-sm text-gray-400">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-center gap-2">
                       {/* <button className="bg-[#e8f5e9] text-[#2e7d32] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest hover:bg-[#2e7d32] hover:text-white transition">NOTES</button>*/}
                        <button 
                          onClick={() => setSelectedPassenger(p)}
                          className="bg-[#ede7f6] text-[#5e35b1] px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest hover:bg-[#5e35b1] hover:text-white transition"
                        >
                          VIEW
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DETAIL DOSSIER (Modal) */}
      {selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-white text-[#1a1a1a] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] border border-white/20">
            {/* Left: Identity Image */}
            <div className="md:w-1/3 bg-gray-100 relative">
              {renderImage(selectedPassenger.id_photo_url)}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Auth Status</p>
                <p className="text-lg font-black uppercase">{selectedPassenger.is_verified ? 'Verified' : 'Pending'}</p>
              </div>
            </div>

            {/* Right: Registry Information */}
            <div className="md:w-2/3 p-12 overflow-y-auto custom-scrollbar relative">
               <button onClick={() => setSelectedPassenger(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black transition-colors"><X size={24}/></button>

               <div className="mb-10">
                 <h3 className="text-4xl font-black tracking-tighter mb-1 leading-none">{selectedPassenger.full_name}</h3>
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Authorized Registry File</p>
               </div>

               <div className="grid grid-cols-2 gap-y-10 gap-x-12">
                  <InfoItem icon={<Mail size={12}/>} label="Email Address" value={selectedPassenger.email} />
                  <InfoItem icon={<Fingerprint size={12}/>} label="National ID" value={selectedPassenger.id_number} />
                  <InfoItem icon={<Phone size={12}/>} label="Contact Line" value={selectedPassenger.phone} />
                  <InfoItem icon={<Calendar size={12}/>} label="Date of Birth" value={selectedPassenger.dob} />
                  <InfoItem icon={<MapPin size={12}/>} label="Primary Address" value={selectedPassenger.address} />
                  <InfoItem icon={<Clock size={12}/>} label="Registry Date" value={new Date(selectedPassenger.created_at).toLocaleDateString()} />
               </div>

              {/* <div className="mt-16 pt-8 border-t border-gray-100 flex gap-4">
                  <button className="bg-[#5e35b1] text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Approve Access</button>
                  <button className="border border-red-100 text-red-500 px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-50">Flag Record</button>
               </div>*/}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterDropdown = ({ label }) => (
  <div className="bg-[#1a1a1a] border border-white/5 px-5 py-2.5 rounded-full flex items-center gap-3 cursor-pointer hover:bg-[#222] transition">
    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
    <ChevronDown size={14} className="text-gray-600" />
  </div>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
      <span className="text-[#9575cd]">{icon}</span> {label}
    </span>
    <span className="text-sm font-bold text-gray-800">{value || '---'}</span>
  </div>
);

export default AdminPassengers;