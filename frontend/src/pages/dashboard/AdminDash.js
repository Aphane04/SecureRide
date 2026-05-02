import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navClass = ({ isActive }) =>
  `block px-3 py-2 rounded-lg text-sm font-semibold transition ${
    isActive ? 'bg-green-900/20 text-green-400' : 'text-gray-500 hover:bg-[#0f0f0f]'
  }`;

const AdminDash = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      <div className="w-64 bg-black p-6 border-r border-green-900/30">
        <h1 className="text-xl font-bold text-green-500 mb-10">SecureRide Admin</h1>
        <div className="space-y-3">
          <NavLink to="/dashboard/admin" end className={navClass}>Overview</NavLink>
          <NavLink to="drivers" className={navClass}>Drivers Management</NavLink>
          <NavLink to="passengers" className={navClass}>Passenger Logs</NavLink>
          <NavLink to="alerts" className={navClass}>Alert Center</NavLink>
        </div>
      </div>

      <div className="flex-1 p-10">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDash;