import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { Search, Download, Eye, ShieldCheck, ShieldAlert, X, Phone, MapPin, User, Mail, Fingerprint } from 'lucide-react';

const AdminPassengers = () => {
  const [passengers, setPassengers] = useState([]);
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    adminAPI.passengers().then((res) => setPassengers(res.data));
  }, []);

  const API_BASE_URL = "http://localhost:8000"; // Update to your API

  return (
    <div className="animate-in fade-in duration-500">
      {/* Title Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#1a1f37]">Passenger Work Management</h2>
        <p className="text-sm text-gray-400">Class students' biometric correction and management.</p>
      </div>

      {/* Tabs - Exactly like the image */}
      <div className="flex items-center gap-1 mb-6">
        {['All', 'Verified', 'Pending', 'Flagged'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-2.5 rounded-t-2xl text-xs font-bold transition-all ${
              activeTab === tab 
              ? 'bg-white text-blue-600 shadow-[-5px_-5px_15px_rgba(0,0,0,0.02)]' 
              : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab} Logs
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-b-3xl rounded-tr-3xl shadow-sm border border-gray-100 mb-8 flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Search Name</p>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
            <input type="text" placeholder="Please enter here" className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 pl-10 text-xs outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Account Type</p>
          <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-xs outline-none">
            <option>All Types</option>
            <option>Passenger</option>
            <option>Driver</option>
          </select>
        </div>

        <div className="flex items-end gap-3 pt-6">
          <button className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">Search</button>
          <button className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-100 transition">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Full Name</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Email Address</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Updated Time</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Status</th>
              <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Operate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {passengers.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                      {p.full_name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{p.full_name}</span>
                  </div>
                </td>
                <td className="p-5 text-xs text-gray-500 font-medium">{p.email}</td>
                <td className="p-5 text-xs text-gray-400">2023.10.15 14:20</td>
                <td className="p-5">
                  {p.is_verified ? (
                    <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-100 flex items-center w-fit gap-1">
                      <ShieldCheck size={12}/> Verified
                    </span>
                  ) : (
                    <span className="bg-gray-50 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-100 flex items-center w-fit gap-1">
                      <ShieldAlert size={12}/> Pending
                    </span>
                  )}
                </td>
                <td className="p-5">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setSelectedPassenger(p)} className="px-4 py-1.5 border border-blue-100 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition">Notice</button>
                    <button className="px-4 py-1.5 border border-blue-100 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-50 transition">Verify</button>
                    <button className="px-4 py-1.5 border border-red-100 text-red-400 rounded-lg text-[10px] font-bold hover:bg-red-50 transition">Flag</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="mt-8 flex justify-end gap-2 px-4">
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-400 hover:border-blue-500 hover:text-blue-500 transition">1</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-400">2</button>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-xs text-gray-400">3</button>
      </div>

      {/* Profile Modal (View Details) */}
      {selectedPassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1a1f37]/40 backdrop-blur-sm animate-in zoom-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white">
            {/* Left Image Area */}
            <div className="md:w-1/3 bg-gray-100 border-r border-gray-100 relative">
              <img 
                src={`${API_BASE_URL}${selectedPassenger.id_photo_url}`} 
                alt="Identity" 
                className="w-full h-full object-cover grayscale-[30%]"
              />
              <button onClick={() => setSelectedPassenger(null)} className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition">
                <X size={20} />
              </button>
            </div>

            {/* Right Details Area */}
            <div className="md:w-2/3 p-12">
               <div className="mb-10">
                 <h3 className="text-3xl font-black text-[#1a1f37] tracking-tighter mb-2">{selectedPassenger.full_name}</h3>
                 <p className="text-blue-600 font-bold text-xs uppercase tracking-widest">Passenger Registry Dossier</p>
               </div>

               <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <Detail label="Full Identity" value={selectedPassenger.full_name} icon={<User size={12}/>} />
                  <Detail label="ID/Passport" value={selectedPassenger.id_number} icon={<Fingerprint size={12}/>} />
                  <Detail label="Contact" value={selectedPassenger.phone} icon={<Phone size={12}/>} />
                  <Detail label="Email" value={selectedPassenger.email} icon={<Mail size={12}/>} />
                  <Detail label="Address" value={selectedPassenger.address} icon={<MapPin size={12}/>} />
               </div>

               <div className="mt-12 pt-8 border-t border-gray-50 flex gap-4">
                  <button className="bg-blue-600 text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-blue-200 transition">Approve User</button>
                  <button onClick={() => setSelectedPassenger(null)} className="bg-gray-100 text-gray-500 px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition">Close</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Detail = ({ label, value, icon }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
      {icon} {label}
    </span>
    <span className="text-sm font-bold text-[#1a1f37]">{value || '---'}</span>
  </div>
);

export default AdminPassengers;