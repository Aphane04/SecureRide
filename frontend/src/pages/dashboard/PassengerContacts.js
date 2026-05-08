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
  XCircle
} from 'lucide-react';

const PassengerContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', relationship_type: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadContacts = async () => {
    try {
      const res = await contactAPI.list();
      setContacts(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sync security contacts.');
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await contactAPI.update(editingId, form);
        setEditingId(null);
      } else {
        await contactAPI.create(form);
      }
      setForm({ name: '', phone: '', relationship_type: '' });
      loadContacts();
    } catch (err) {
      setError(err.response?.data?.detail || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (contact) => {
    setEditingId(contact.id);
    setForm({ name: contact.name, phone: contact.phone, relationship_type: contact.relationship_type || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this emergency contact?")) return;
    try {
      await contactAPI.remove(id);
      loadContacts();
    } catch (err) {
      setError('Deletion failed.');
    }
  };

  // Design Helpers
  const inputClass = "w-full bg-gray-100 border border-gray-200 text-black p-3 pl-10 rounded-xl text-sm focus:border-green-500 focus:bg-white outline-none transition-all placeholder:text-gray-400";
  const labelClass = "text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 ml-1";

  return (
    <div className="min-h-full bg-white font-sans p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#008751]">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Safety Network</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-black uppercase">Emergency Contacts</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Manage contacts for automated AI safety dispatch.</p>
          </div>
          <div className="bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
             <span className="text-[10px] font-black text-black">{contacts.length} / 5 SECURED</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* LEFT: Form Section */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm sticky top-8">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                {editingId ? <Edit3 size={16} className="text-blue-500" /> : <Plus size={16} className="text-[#008751]" />}
                {editingId ? 'Modify Contact' : 'Register Contact'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col">
                  <label className={labelClass}>Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input className={inputClass} placeholder="Authorized Name" required
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={labelClass}>Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input className={inputClass} placeholder="+27 ..." required
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className={labelClass}>Relationship</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-3.5 text-gray-400" size={16} />
                    <input className={inputClass} placeholder="e.g. Spouse, Brother" required
                      value={form.relationship_type} onChange={(e) => setForm({ ...form, relationship_type: e.target.value })} />
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-black hover:bg-[#008751] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : editingId ? 'Update Record' : 'Secure Contact'}
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

          {/* RIGHT: Contacts List Section */}
          <div className="lg:col-span-7">
            {contacts.length === 0 ? (
              <div className="h-64 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                <AlertCircle size={32} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">Safety database is currently empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contacts.map((c) => (
                  <div 
                    key={c.id} 
                    className="group bg-gray-50 border border-gray-100 p-6 rounded-[2rem] flex justify-between items-center hover:bg-white hover:shadow-md hover:border-green-500/20 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-gray-100 text-black font-black shadow-sm group-hover:bg-[#008751] group-hover:text-white transition-colors">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-black tracking-tight">{c.name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] font-medium text-gray-500">{c.phone}</span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="text-[10px] font-black text-[#008751] uppercase tracking-tighter">{c.relationship_type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(c)} 
                        className="p-2.5 bg-white border border-gray-100 text-gray-600 rounded-xl hover:text-blue-600 hover:border-blue-100 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => remove(c.id)} 
                        className="p-2.5 bg-white border border-gray-100 text-gray-600 rounded-xl hover:text-red-600 hover:border-red-100 transition-all"
                      >
                        <Trash2 size={16} />
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

export default PassengerContacts;