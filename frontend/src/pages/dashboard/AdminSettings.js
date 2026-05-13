import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';
import { 
  Trash2, CheckCircle, XCircle, ShieldCheck, RefreshCw 
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

  // Sync filtered list when filters or users change
  useEffect(() => {
    let result = [...users];
    if (roleFilter !== 'All') result = result.filter(u => u.role === roleFilter);
    if (genderFilter !== 'All') result = result.filter(u => u.gender === genderFilter);
    setFilteredUsers(result);
    // Clear selection when filter changes to prevent deleting hidden users
    setSelectedIds([]);
  }, [roleFilter, genderFilter, users]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // NEW: Select All Logic
  const handleSelectAll = () => {
    if (selectedIds.length === filteredUsers.length) {
      setSelectedIds([]); // If all are selected, deselect all
    } else {
      setSelectedIds(filteredUsers.map(u => u.id)); // Otherwise, select all filtered users
    }
  };

 const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    if (window.confirm(`SECURITY ALERT: Permanently purge ${selectedIds.length} users and all associated trip/biometric data?`)) {
      try {
        setLoading(true); // Show loading while deleting
        await adminAPI.bulkDelete(selectedIds);
        
        // Success feedback
        alert("Database purged. Synchronizing system...");
        
        // FORCE UI RESET
        setSelectedIds([]);
        setIsDeleteMode(false);
        
        // Re-fetch fresh data from server
        await loadData(); 
        
      } catch (err) {
        const errorMsg = err.response?.data?.detail || "Delete failed due to database constraint.";
        alert(`CRITICAL ERROR: ${errorMsg}`);
        loadData(); // Refresh anyway to sync state
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8 px-2">
        <div>
          <h2 className="text-3xl font-black text-black uppercase tracking-tighter leading-none">System Settings</h2>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Global Data Control Panel</p>
        </div>
        <div className="flex gap-4">
            <button onClick={loadData} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-all shadow-sm">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
                onClick={() => { setIsDeleteMode(!isDeleteMode); setSelectedIds([]); }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
                    isDeleteMode ? 'bg-red-600 text-white shadow-red-200' : 'bg-black text-white hover:bg-[#008751]'
                }`}
            >
                {isDeleteMode ? 'Exit Selection' : 'Clear Database'}
            </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8 flex flex-wrap gap-8 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Filter Role</label>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold text-black outline-none">
            <option value="All">All System Roles</option>
            <option value="Passenger">Passenger</option>
            <option value="Driver">Driver</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Filter Gender</label>
          <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs font-bold text-black outline-none">
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        
        {isDeleteMode && selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} className="bg-red-600 text-white px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-pulse shadow-xl shadow-red-100">
            <Trash2 size={16}/> Purge ({selectedIds.length}) Records
          </button>
        )}
      </div>

      {/* Main Registry */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              {isDeleteMode && (
                <th className="p-6 w-10 text-center">
                  {/* MASTER SELECT ALL CHECKBOX */}
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-600 cursor-pointer" 
                  />
                </th>
              )}
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">System Member</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
              <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Auth</th>
            </tr>
          </thead>
          <tbody className="text-black font-bold">
            {!loading && filteredUsers.map((u) => (
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
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white text-xs font-black shadow-lg">
                       {u.full_name ? u.full_name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-black leading-none mb-1">{u.full_name || 'Incomplete Profile'}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                    <span className="text-[10px] font-black uppercase px-3 py-1 bg-gray-100 rounded-full text-gray-500 border border-gray-200">
                        {u.role}
                    </span>
                </td>
                <td className="p-6 text-center">
                  {u.is_verified ? (
                    <div className="flex flex-col items-center gap-1">
                        <ShieldCheck size={16} className="text-green-500" />
                        <span className="text-[8px] font-black text-green-600 uppercase tracking-tighter">Secured</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 opacity-20">
                        <XCircle size={16} className="text-gray-400" />
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Pending</span>
                    </div>
                  )}
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