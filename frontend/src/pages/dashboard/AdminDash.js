import React from 'react';

const AdminDash = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-black p-6 border-r border-green-900/30">
        <h1 className="text-xl font-bold text-green-500 mb-10">SecureRide Admin</h1>
        <div className="space-y-4">
          <div className="text-green-400 bg-green-900/10 p-2 rounded">Overview</div>
          <div className="text-gray-500 p-2">Drivers Management</div>
          <div className="text-gray-500 p-2">Passenger Logs</div>
          <div className="text-gray-500 p-2">Alert Center</div>
        </div>
      </div>

      <div className="flex-1 p-10">
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-[#121212] p-6 rounded-lg border-b-2 border-green-500">
            <p className="text-gray-400 text-sm">Active Drivers</p>
            <p className="text-3xl font-bold">1,240</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-lg border-b-2 border-green-500">
            <p className="text-gray-400 text-sm">Active Passengers</p>
            <p className="text-3xl font-bold">8,500</p>
          </div>
          <div className="bg-[#121212] p-6 rounded-lg border-b-2 border-red-500">
            <p className="text-gray-400 text-sm">Safety Alerts (Live)</p>
            <p className="text-3xl font-bold text-red-500">0</p>
          </div>
        </div>

        <h3 className="text-xl font-bold mb-6">User Verification Queue</h3>
        <div className="bg-[#121212] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black text-gray-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">ID Status</th>
                <th className="p-4 font-medium">Face Scan</th>
                <th className="p-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr>
                <td className="p-4">Alice Johnson</td>
                <td className="p-4">Driver</td>
                <td className="p-4 text-green-500">Verified</td>
                <td className="p-4 text-green-500">Matched</td>
                <td className="p-4"><button className="text-blue-400 text-sm">Approve</button></td>
              </tr>
              {/* More rows would be mapped here */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDash;