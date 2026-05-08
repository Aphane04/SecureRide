import React, { useEffect, useState } from 'react';
import { authAPI } from '../../utils/api';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Fingerprint, 
  ShieldCheck, 
  Save, 
  Info,
  ChevronRight
} from 'lucide-react';

const PassengerAccount = () => {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    dob: '',
    gender: '',
    id_number: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authAPI.getProfile().then((res) => {
      setForm(res.data);
    });
  }, []);

  const update = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await authAPI.updateProfile({
          full_name: form.full_name,
          phone: form.phone,
          address: form.address,
          dob: form.dob,
          gender: form.gender,
          id_number: form.id_number,
          email: form.email,
        });
        alert('Profile updated successfully.');
    } catch (err) {
        alert('Update failed. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  // Design Helpers
  const inputClass = "w-full bg-gray-100 border border-gray-200 text-black p-3 pl-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1 flex items-center gap-2";

  return (
    <div className="min-h-full bg-white font-sans p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#008751]">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Terminal</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Account Settings</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium italic">Authorized records for {form.full_name || 'Passenger'}</p>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
             <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-black text-sm border-2 border-[#008751]">
                {form.full_name?.charAt(0).toUpperCase() || 'P'}
             </div>
             <div>
                <p className="text-[10px] font-black text-black uppercase tracking-widest leading-none mb-1">Status</p>
                <p className="text-xs font-bold text-green-600 uppercase flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Verified User
                </p>
             </div>
          </div>
        </div>

        <form onSubmit={update} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT: Personal Information */}
            <div className="lg:col-span-7 space-y-8">
                <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black mb-8 pb-4 border-b border-gray-50 flex items-center gap-2">
                        <User size={16} className="text-[#008751]" /> Basic Information
                    </h3>

                    <div className="space-y-6">
                        <div className="flex flex-col">
                            <label className={labelClass}>Legal Full Name</label>
                            <div className="relative text-black">
                                <User className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass} placeholder="Full Name" value={form.full_name} 
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelClass}>Authorized Email</label>
                            <div className="relative text-black">
                                <Mail className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass} placeholder="Email" value={form.email} 
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                                <label className={labelClass}>Mobile Number</label>
                                <div className="relative text-black">
                                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                    <input className={inputClass} placeholder="Phone" value={form.phone} 
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className={labelClass}>Date of Birth</label>
                                <div className="relative text-black">
                                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                    <input type="date" className={inputClass} value={form.dob || ''} 
                                        onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelClass}>Residential Address</label>
                            <div className="relative text-black">
                                <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass} placeholder="Address" value={form.address} 
                                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: System Information & Action */}
            <div className="lg:col-span-5 space-y-8">
                <div className="bg-gray-50 border border-gray-100 p-8 rounded-[2.5rem]">
                    <h3 className="text-sm font-black uppercase tracking-widest text-black mb-8 flex items-center gap-2">
                        <Fingerprint size={16} className="text-[#008751]" /> Identity Data
                    </h3>

                    <div className="space-y-6">
                        <div className="flex flex-col">
                            <label className={labelClass}>ID / Passport Number</label>
                            <div className="relative text-black">
                                <Fingerprint className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass + " bg-white"} placeholder="ID Number" value={form.id_number} 
                                    onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelClass}>Gender Bias</label>
                            <div className="relative text-black">
                                <Info className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass + " bg-white"} placeholder="Gender" value={form.gender} 
                                    onChange={(e) => setForm({ ...form, gender: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-4 bg-white rounded-2xl border border-gray-100 flex items-start gap-3">
                        <Info size={16} className="text-gray-400 mt-0.5" />
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed uppercase tracking-tighter">
                            Registry data is linked to your biometric hash. Major changes may require a re-scan.
                        </p>
                    </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black hover:bg-[#008751] text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'Synchronizing...' : (
                    <>
                        <Save size={18} /> Save Settings
                    </>
                  )}
                </button>
            </div>

        </form>

        <div className="mt-20 border-t border-gray-100 pt-10 text-center opacity-30 grayscale">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-black">SecureRide Profile Control Center</span>
        </div>
      </div>
    </div>
  );
};

export default PassengerAccount;