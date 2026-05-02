import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    adminAPI.drivers().then((res) => setDrivers(res.data));
  }, []);

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">Drivers Management</h3>
      <div className="bg-[#121212] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black text-gray-400 text-sm">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {drivers.map((d) => (
              <tr key={d.id}>
                <td className="p-4">{d.full_name}</td>
                <td className="p-4">{d.email}</td>
                <td className="p-4">{d.is_verified ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDrivers;