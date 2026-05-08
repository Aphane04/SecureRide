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
  BadgeCheck,
  Zap
} from 'lucide-react';

const DriverAccount = () => {
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
        alert('Driver profile synchronized.');
    } catch (err) {
        alert('Update failed. Please check network connection.');
    } finally {
        setLoading(false);
    }
  };

  // Design Helpers
  const inputClass = "w-full bg-gray-100 border border-gray-200 text-black p-3 pl-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 ml-1 flex items-center gap-2";

  return (
    <div className="min-h-full bg-white font-sans p-8 text-black">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#008751]">
                <BadgeCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Fleet Registry Terminal</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Driver Profile</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium italic">Managed records for {form.full_name || 'Authorized Driver'}</p>
          </div>

          <div className="flex items-center gap-5 bg-gray-50 p-5 rounded-[2rem] border border-gray-100 shadow-sm">
             <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white font-black text-lg border-2 border-[#008751] shadow-lg">
                {form.full_name?.charAt(0).toUpperCase() || 'D'}
             </div>
             <div>
                <p className="text-[10px] font-black text-black uppercase tracking-widest leading-none mb-1.5">Verification</p>
                <div className="px-3 py-1 bg-green-50 border border-green-100 rounded-full flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-green-700 uppercase tracking-tighter">Active Protocol</span>
                </div>
             </div>
          </div>
        </div>

        <form onSubmit={update} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* LEFT: Personal Information */}
            <div className="lg:col-span-7">
                <div className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black mb-10 pb-4 border-b border-gray-50 flex items-center gap-3">
                        <User size={16} className="text-[#008751]" /> Primary Information
                    </h3>

                    <div className="space-y-7">
                        <div className="flex flex-col">
                            <label className={labelClass}>Legal Name & Surname</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass} placeholder="Full Name" value={form.full_name} 
                                    onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelClass}>Authorized Communication Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass} placeholder="Email" value={form.email} 
                                    onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                            <div className="flex flex-col">
                                <label className={labelClass}>Registered Mobile</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                    <input className={inputClass} placeholder="Phone" value={form.phone} 
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <label className={labelClass}>Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                    <input type="date" className={inputClass} value={form.dob || ''} 
                                        onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelClass}>Base of Operations (Address)</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass} placeholder="Physical Address" value={form.address} 
                                    onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Compliance & Sync */}
            <div className="lg:col-span-5 space-y-10">
                <div className="bg-gray-50 border border-gray-100 p-10 rounded-[2.5rem]">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-black mb-10 flex items-center gap-3">
                        <Fingerprint size={16} className="text-[#008751]" /> Compliance Data
                    </h3>

                    <div className="space-y-7">
                        <div className="flex flex-col">
                            <label className={labelClass}>ID / Passport / License</label>
                            <div className="relative">
                                <Fingerprint className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass + " bg-white"} placeholder="ID Number" value={form.id_number} 
                                    onChange={(e) => setForm({ ...form, id_number: e.target.value })} />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelClass}>Gender Assignment</label>
                            <div className="relative">
                                <Info className="absolute left-3 top-3.5 text-gray-400" size={16} />
                                <input className={inputClass + " bg-white"} placeholder="Gender" value={form.gender} 
                                    onChange={(e) => setForm({ ...form, gender: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 p-6 bg-white rounded-3xl border border-gray-100 flex items-start gap-4">
                        <Zap size={20} className="text-orange-400 mt-1 flex-shrink-0" />
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                            Identity records are linked to your biometric safety token. Updates to these fields trigger a mandatory network audit.
                        </p>
                    </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black hover:bg-[#008751] text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl active:scale-[0.97] flex items-center justify-center gap-4 disabled:opacity-40"
                >
                  {loading ? 'SYNCHRONIZING TERMINAL...' : (
                    <>
                        <Save size={18} /> Update Driver File
                    </>
                  )}
                </button>
                
                <p className="text-center text-[9px] text-gray-300 font-black uppercase tracking-[0.4em]">
                    SecureRide Encryption Standard v2.0
                </p>
            </div>

        </form>
      </div>
    </div>
  );
};

export default DriverAccount;