import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Users, Filter, Trash2, Calendar, 
  Search, CheckCircle, XCircle, ShieldCheck, Loader2, X, Database
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
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      console.error("User sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    let result = users;
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
    if (genderFilter !== 'All') result = result.filter(u => u.gender === genderFilter);
    if (dateFilter) result = result.filter(u => u.created_at?.includes(dateFilter));
    setFilteredUsers(result);
  }, [roleFilter, genderFilter, dateFilter, users]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to purge ${selectedIds.length} records?`)) {
      try {
        await adminAPI.bulkDelete(selectedIds);
        alert("Records purged.");
        setIsDeleteMode(false);
        setSelectedIds([]);
        loadUsers();
      } catch (err) { alert("Purge failed."); }
    }
  };

  return (
    // FORCING WHITE/GRAY BACKGROUND TO PREVENT BLACK SCREEN
    <div className="min-h-full w-full bg-[#f8f9fa] animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-10 p-2">
        <div>
          <h2 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">System Terminal</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">Global Registry Management</p>
        </div>
        <button 
          onClick={() => { setIsDeleteMode(!isDeleteMode); setSelectedIds([]); }}
          className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
            isDeleteMode ? 'bg-red-600 text-white' : 'bg-black text-white hover:bg-green-600'
          }`}
        >
          {isDeleteMode ? 'Exit Selection' : 'Clear Database'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-10 flex flex-wrap gap-8 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Account Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold outline-none text-black">
            <option value="All">All Identities</option>
            <option value="Passenger">Passenger</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Gender Bias</label>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-xs font-bold outline-none text-black">
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        
        {isDeleteMode && selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} className="bg-red-600 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse shadow-lg shadow-red-100">
            <Trash2 size={16}/> Delete {selectedIds.length} Records
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[500px]">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {isDeleteMode && <th className="p-6 w-10"></th>}
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">System Member</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Role</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Gender</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Auth Status</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {loading ? (
                <tr><td colSpan="5" className="p-32 text-center font-black uppercase text-gray-300 animate-pulse tracking-widest">Synchronizing terminal records...</td></tr>
            ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-32 text-center text-gray-400 font-bold uppercase tracking-widest italic text-xs">No active records found in current sector.</td></tr>
            ) : (
                filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {isDeleteMode && (
                        <td className="p-6">
                          <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} className="w-6 h-6 rounded-lg border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer" />
                        </td>
                      )}
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-black shadow-md border-2 border-white">
                             {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-black leading-none mb-1">{u.full_name || 'Incomplete profile'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-gray-100 rounded-full text-gray-500 border border-gray-200">{u.role}</span>
                      </td>
                      <td className="p-6 text-xs text-center font-black text-black uppercase">{u.gender || 'N/A'}</td>
                      <td className="p-6">
                        {u.is_verified ? (
                            <div className="flex items-center justify-center text-green-600 gap-1.5 font-black text-[9px] uppercase tracking-widest">
                                <ShieldCheck size={14}/> Verified
                            </div>
                        ) : (
                            <div className="flex items-center justify-center text-gray-300 gap-1.5 font-black text-[9px] uppercase tracking-widest italic">
                                <XCircle size={14}/> Unsecured
                            </div>
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