import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { History, Phone, User, Home } from 'lucide-react';
import { authAPI } from '../../utils/api';

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
    isActive ? 'bg-[#008751] text-white shadow-lg' : 'text-gray-400 hover:bg-[#1a1a1a]'
  }`;

const DriverDash = () => {
  const [fullName, setFullName] = useState('Driver');

  useEffect(() => {
    authAPI.getProfile().then((res) => {
      if (res.data?.full_name) setFullName(res.data.full_name);
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#0a0a0a] text-white overflow-hidden">
      <aside className="w-full lg:w-72 bg-[#111] border-r border-gray-900 p-6 flex flex-col gap-6">
        <div>
          <p className="text-xs text-gray-400">Welcome</p>
          <p className="font-bold text-lg">{fullName}</p>
        </div>

        <nav className="space-y-2 mt-4">
          <NavLink to="/dashboard/driver" end className={navClass}><Home size={18} /> Dashboard</NavLink>
          <NavLink to="history" className={navClass}><History size={18} /> Trip History</NavLink>
          <NavLink to="contacts" className={navClass}><Phone size={18} /> Emergency Contacts</NavLink>
          <NavLink to="account" className={navClass}><User size={18} /> Account</NavLink>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-[#0f0f0f]">
        <Outlet />
      </main>
    </div>
  );
};

export default DriverDash;