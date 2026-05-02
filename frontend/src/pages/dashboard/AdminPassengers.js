import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const AdminPassengers = () => {
  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    adminAPI.passengers().then((res) => setPassengers(res.data));
  }, []);

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">Passenger Logs</h3>
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
            {passengers.map((p) => (
              <tr key={p.id}>
                <td className="p-4">{p.full_name}</td>
                <td className="p-4">{p.email}</td>
                <td className="p-4">{p.is_verified ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPassengers;