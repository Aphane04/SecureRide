import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const AdminAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    adminAPI.alerts().then((res) => setAlerts(res.data));
  }, []);

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">Alert Center</h3>
      <div className="bg-[#121212] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black text-gray-400 text-sm">
            <tr>
              <th className="p-4">Trip ID</th>
              <th className="p-4">Transcript</th>
              <th className="p-4">Detected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="p-4">{a.trip_id}</td>
                <td className="p-4">{a.transcript}</td>
                <td className="p-4 text-sm text-gray-400">{new Date(a.detected_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAlerts;