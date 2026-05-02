import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../utils/api';

const AdminOverview = () => {
  const [overview, setOverview] = useState({ drivers: 0, passengers: 0, active_trips: 0, safety_alerts: 0 });
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    adminAPI.overview().then((res) => setOverview(res.data));
    adminAPI.trips().then((res) => setTrips(res.data));
  }, []);

  return (
    <div>
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-[#121212] p-6 rounded-lg border-b-2 border-green-500">
          <p className="text-gray-400 text-sm">Active Drivers</p>
          <p className="text-3xl font-bold">{overview.drivers}</p>
        </div>
        <div className="bg-[#121212] p-6 rounded-lg border-b-2 border-green-500">
          <p className="text-gray-400 text-sm">Active Passengers</p>
          <p className="text-3xl font-bold">{overview.passengers}</p>
        </div>
        <div className="bg-[#121212] p-6 rounded-lg border-b-2 border-red-500">
          <p className="text-gray-400 text-sm">Safety Alerts (Live)</p>
          <p className="text-3xl font-bold text-red-500">{overview.safety_alerts}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold mb-6">Recent Trips</h3>
      <div className="bg-[#121212] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black text-gray-400 text-sm">
            <tr>
              <th className="p-4">Passenger</th>
              <th className="p-4">Pickup</th>
              <th className="p-4">Destination</th>
              <th className="p-4">Fare</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {trips.map((t) => (
              <tr key={t.id}>
                <td className="p-4">{t.passenger_email}</td>
                <td className="p-4">{t.pickup_location}</td>
                <td className="p-4">{t.destination}</td>
                <td className="p-4 text-green-500">R {t.fare}</td>
                <td className="p-4">{t.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOverview;