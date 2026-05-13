import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Users, Filter, Trash2, Calendar, 
  Search, CheckCircle, XCircle, ShieldCheck, Loader2, X, RefreshCw
} from 'lucide-react';

const AdminSettings = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [roleFilter, setRoleFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAllUsers();
      console.log("DB DATA RECEIVED:", res.data); // LOG TO CHECK DATA
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  // Live Filtering
  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
    if (genderFilter !== 'All') result = result.filter(u => u.gender === genderFilter);
    if (dateFilter) result = result.filter(u => u.created_at?.includes(dateFilter));
    setFilteredUsers(result);
  }, [roleFilter, genderFilter, dateFilter, users]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Permanently purge ${selectedIds.length} records?`)) {
      try {
        await adminAPI.bulkDelete(selectedIds);
        alert("Wipe successful.");
        setIsDeleteMode(false);
        setSelectedIds([]);
        loadUsers();
      } catch (err) { alert("Purge failed."); }
    }
  };

  return (
    <div className="min-h-full w-full bg-[#f8f9fa] p-4 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter">System Registry</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Manage global user accounts</p>
        </div>
        <div className="flex gap-4">
            <button onClick={loadUsers} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-all shadow-sm">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
            onClick={() => { setIsDeleteMode(!isDeleteMode); setSelectedIds([]); }}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                isDeleteMode ? 'bg-red-600 text-white shadow-red-200' : 'bg-black text-white hover:bg-green-600'
            } shadow-lg`}
            >
            {isDeleteMode ? 'Cancel Selection' : 'Clear Database'}
            </button>
        </div>
      </div>

      {/* Filter Bar - Fixed Dropdowns */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-8 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Filter Role</label>
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-black focus:ring-1 focus:ring-black outline-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="Passenger">Passenger</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Filter Gender</label>
          <select 
            value={genderFilter} 
            onChange={(e) => setGenderFilter(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-black focus:ring-1 focus:ring-black outline-none cursor-pointer"
          >
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">Registry Date</label>
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-xs font-bold text-black outline-none" 
          />
        </div>
        
        {isDeleteMode && selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} className="bg-red-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-bounce shadow-xl">
            <Trash2 size={16}/> Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              {isDeleteMode && <th className="p-6 w-10 text-center">#</th>}
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Authorized Member</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">System Role</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gender</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Auth Status</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {loading ? (
                <tr><td colSpan="6" className="p-32 text-center text-gray-300 font-black uppercase animate-pulse">Establishing secure link...</td></tr>
            ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="p-32 text-center text-gray-400 font-bold uppercase italic text-xs">No records matching filters found.</td></tr>
            ) : (
                filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {isDeleteMode && (
                        <td className="p-6 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(u.id)} 
                            onChange={() => toggleSelect(u.id)} 
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer" 
                          />
                        </td>
                      )}
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-black shadow-lg border-2 border-white">
                             {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-black leading-none mb-1">{u.full_name || 'Anonymous User'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-[10px] font-black uppercase px-3 py-1 bg-gray-100 rounded-full text-gray-500 border border-gray-200">{u.role}</span>
                      </td>
                      <td className="p-6 text-xs text-center font-bold text-black uppercase">{u.gender || 'N/A'}</td>
                      <td className="p-6 text-center">
                        {u.is_verified ? (
                            <span className="flex items-center justify-center text-green-600 gap-1.5 font-black text-[9px] uppercase tracking-widest">
                                <ShieldCheck size={14}/> Verified
                            </span>
                        ) : (
                            <span className="flex items-center justify-center text-gray-300 gap-1.5 font-black text-[9px] uppercase tracking-widest italic">
                                <XCircle size={14}/> Unsecured
                            </span>
                        )}
                      </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSettings;