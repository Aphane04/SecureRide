import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Trash2, CheckCircle, XCircle, ShieldCheck, RefreshCw, Filter
} from 'lucide-react';

const AdminSettings = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [roleFilter, setRoleFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllUsers();
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
    if (genderFilter !== 'All') result = result.filter(u => u.gender === genderFilter);
    setFilteredUsers(result);
  }, [roleFilter, genderFilter, users]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Delete ${selectedIds.length} users permanently?`)) {
      try {
        await adminAPI.bulkDelete(selectedIds);
        alert("Records deleted.");
        setSelectedIds([]);
        setIsDeleteMode(false);
        loadData();
      } catch (err) { alert("Error during deletion."); }
    }
  };

  return (
    <div className="p-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-black uppercase tracking-tighter">System Settings</h2>
        <div className="flex gap-4">
            <button onClick={loadData} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
                onClick={() => { setIsDeleteMode(!isDeleteMode); setSelectedIds([]); }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                    isDeleteMode ? 'bg-red-600 text-white' : 'bg-black text-white hover:bg-green-600'
                }`}
            >
                {isDeleteMode ? 'Cancel Selection' : 'Clear Database'}
            </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex gap-8">
        <div className="flex-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold text-black outline-none">
            <option value="All">All Roles</option>
            <option value="Passenger">Passenger</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Gender</label>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold text-black outline-none">
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        {isDeleteMode && selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} className="mt-6 bg-red-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-bounce">
            <Trash2 size={14}/> Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {isDeleteMode && <th className="p-6 w-10 text-center">#</th>}
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Details</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">Status</th>
            </tr>
          </thead>
          <tbody className="text-black font-bold">
            {!loading && filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                {isDeleteMode && (
                  <td className="p-6 text-center">
                    <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer" />
                  </td>
                )}
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-black shadow-lg">
                       {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-sm">{u.full_name || 'Incomplete Profile'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6 text-xs text-gray-500 uppercase">{u.role}</td>
                <td className="p-6 text-center">
                  {u.is_verified ? <CheckCircle size={16} className="text-green-500 mx-auto" /> : <XCircle size={16} className="text-gray-200 mx-auto" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSettings;