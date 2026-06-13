import React, { useEffect, useState } from 'react';
import { contactAPI } from '../../utils/api';
import { 
  User, 
  Phone, 
  Heart, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  ShieldCheck,
  XCircle,
  Users,
  Check
} from 'lucide-react';

const DriverContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', relationship_type: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    try {
      const res = await contactAPI.list();
      // Ensure we treat the data as an array
      setContacts(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      setError('System failed to sync registry records.');
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingId) {
        // UPDATE: Hits @app.put("/contacts/{cid}")
        await contactAPI.update(editingId, form);
        alert("Contact record updated successfully.");
      } else {
        // CREATE: Hits @app.post("/contacts")
        await contactAPI.create(form);
        alert("New contact registered to network.");
      }
      
      // Reset Form
      setForm({ name: '', phone: '', relationship_type: '' });
      setEditingId(null);
      loadContacts(); // Refresh List
    } catch (err) {
      const msg = err.response?.data?.detail || 'Transaction failed. Check network connection.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setForm({ 
      name: contact.name, 
      phone: contact.phone, 
      relationship_type: contact.relationship_type || '' 
    });
    // Scroll to form for better UX on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm("SECURITY PROTOCOL: Permanently delete this emergency contact?")) return;
    try {
      await contactAPI.remove(id);
      loadContacts();
    } catch (err) {
      setError('Deletion failed.');
    }
  };

  // Professional White Design Helpers
  const inputClass = "w-full bg-gray-100 border border-gray-200 text-black p-3 pl-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400 font-medium";
  const labelClass = "text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1.5 ml-1 flex items-center gap-2";

  return (
    <div className="min-h-full bg-white font-sans p-8 text-black animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Branding */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#008751]">
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Driver Safety Network</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Emergency Contacts</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium italic">Verified contacts for emergency biometric triggers.</p>
          </div>
          <div className="bg-gray-100 px-6 py-2.5 rounded-2xl border border-gray-200 flex items-center gap-3">
             <Users size={16} className="text-gray-400" />
             <span className="text-[10px] font-black text-black uppercase tracking-widest">
                {contacts.length} / 5 SECURED
             </span>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-bounce">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: Management Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-100 p-10 rounded-[2.5rem] shadow-sm sticky top-8">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] mb-8 pb-4 border-b border-gray-50 flex items-center gap-3">
                {editingId ? <Edit3 size={16} className="text-blue-500" /> : <Plus size={16} className="text-[#008751]" />}
                {editingId ? 'Modify Record' : 'Register New Contact'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col">
                  <label className={labelClass}><User size={10}/> Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input className={inputClass} placeholder="Legal Name" required
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={labelClass}><Phone size={10}/> Secure Phone Line</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input className={inputClass} placeholder="+27 ..." required
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={labelClass}><Heart size={10}/> Primary Relationship</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input className={inputClass} placeholder="e.g. Brother, Wife, Manager" required
                      value={form.relationship_type} onChange={(e) => setForm({ ...form, relationship_type: e.target.value })} />
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-black hover:bg-[#008751] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : editingId ? 'Update Terminal' : 'Secure Contact'}
                  </button>
                  {editingId && (
                    <button 
                      type="button" 
                      onClick={() => {setEditingId(null); setForm({name:'', phone:'', relationship_type:''})}}
                      className="bg-gray-100 hover:bg-gray-200 p-4 rounded-2xl transition-all"
                    >
                      <XCircle size={20} className="text-gray-500" />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Registry List */}
          <div className="lg:col-span-7">
            {contacts.length === 0 ? (
              <div className="h-full min-h-[400px] border-2 border-dashed border-gray-100 rounded-[3rem] flex flex-col items-center justify-center text-gray-300 p-12">
                <Users size={48} className="mb-4 opacity-10" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-center">Safety Network Empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((c) => (
                  <div 
                    key={c.id} 
                    className="group bg-gray-50 border border-gray-100 p-7 rounded-[2.5rem] flex justify-between items-center hover:bg-white hover:shadow-xl hover:border-green-500/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-gray-100 text-black font-black text-lg shadow-sm group-hover:bg-[#008751] group-hover:text-white transition-all">
                        {c.name ? c.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div className="text-base font-black text-black tracking-tight">{c.name}</div>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs font-bold text-gray-400">{c.phone}</span>
                            
                            {/* FIX 2: Added visual relationship badge */}
                            {c.relationship_type && (
                                <>
                                    <span className="w-1.5 h-1.5 bg-gray-200 rounded-full" />
                                    <span className="text-[10px] font-black text-[#008751] uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded">
                                        {c.relationship_type}
                                    </span>
                                </>
                            )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => startEdit(c)} 
                        className="p-3 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-blue-600 hover:border-blue-100 shadow-sm transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => remove(c.id)} 
                        className="p-3 bg-white border border-gray-100 text-gray-400 rounded-2xl hover:text-red-600 hover:border-red-100 shadow-sm transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DriverContacts;