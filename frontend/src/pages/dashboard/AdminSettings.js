import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Users, Filter, Trash2, Calendar, 
  Search, CheckCircle, XCircle, ShieldCheck
} from 'lucide-react';

const AdminSettings = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Filter States
  const [roleFilter, setRoleFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const res = await adminAPI.getAllUsers();
    setUsers(res.data);
    setFilteredUsers(res.data);
  };

  // Filtering Logic
  useEffect(() => {
    let result = users;
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
    if (genderFilter !== 'All') result = result.filter(u => u.gender === genderFilter);
    if (dateFilter) result = result.filter(u => u.created_at.includes(dateFilter));
    setFilteredUsers(result);
  }, [roleFilter, genderFilter, dateFilter, users]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} users?`)) {
      try {
        await adminAPI.bulkDelete(selectedIds);
        alert("Database synchronized. Records purged.");
        setIsDeleteMode(false);
        setSelectedIds([]);
        loadUsers();
      } catch (err) { alert("Purge failed."); }
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-black tracking-tighter uppercase">System Settings</h2>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Global User & Database Management</p>
        </div>
        <button 
          onClick={() => { setIsDeleteMode(!isDeleteMode); setSelectedIds([]); }}
          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            isDeleteMode ? 'bg-red-600 text-white' : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {isDeleteMode ? 'Cancel Selection' : 'Clear Database'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-6 items-end">
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Filter Role</label>
          <select onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none">
            <option value="All">All Roles</option>
            <option value="Passenger">Passenger</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Filter Gender</label>
          <select onChange={(e) => setGenderFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none">
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Registration Date</label>
          <input type="date" onChange={(e) => setDateFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-xs font-bold outline-none" />
        </div>
        {isDeleteMode && selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} className="bg-red-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-bounce">
            <Trash2 size={14}/> Delete ({selectedIds.length})
          </button>
        )}
      </div>

      {/* User Registry Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {isDeleteMode && <th className="p-6 w-10"></th>}
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase">System Member</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase">Role</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">Gender</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase">Registry Date</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase text-center">Auth</th>
            </tr>
          </thead>
          <tbody className="text-black font-bold">
           {filteredUsers.map((u) => (
  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors text-black">
    {isDeleteMode && (
      <td className="p-6">
        <input 
          type="checkbox" 
          checked={selectedIds.includes(u.id)} 
          onChange={() => toggleSelect(u.id)} 
        />
      </td>
    )}
    <td className="p-6">
      <div className="flex items-center gap-3">
        {/* FIX: Add safety checks here */}
        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-[10px] uppercase font-bold">
           {u.full_name ? u.full_name.charAt(0) : '?'}
        </div>
        <div>
          <p className="text-sm font-black">{u.full_name || 'Incomplete Profile'}</p>
          <p className="text-[10px] text-gray-400 font-bold uppercase">{u.email}</p>
        </div>
      </div>
    </td>
    <td className="p-6 text-xs font-bold uppercase text-gray-500">{u.role}</td>
    <td className="p-6 text-xs text-center text-gray-400">{u.gender || 'N/A'}</td>
    <td className="p-6 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
    {/* ... rest of your code ... */}
  </tr>
))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSettings;