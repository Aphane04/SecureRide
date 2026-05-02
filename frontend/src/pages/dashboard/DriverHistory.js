import React, { useEffect, useState } from 'react';
import { tripAPI } from '../../utils/api';

const DriverHistory = () => {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tripAPI.getDriverHistory();
        setTrips(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load trip history.');
      }
    };
    load();
  }, []);

  return (
    <div className="p-8 text-white">
      <h2 className="text-2xl font-bold mb-6">Trip History</h2>
      {error && <div className="text-red-400 mb-4">{error}</div>}

      {trips.length === 0 ? (
        <div className="text-gray-400">No trips found.</div>
      ) : (
        <div className="bg-[#121212] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black text-gray-400 text-sm">
              <tr>
                <th className="p-4">Pickup</th>
                <th className="p-4">Destination</th>
                <th className="p-4">Fare</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {trips.map((trip) => (
                <tr key={trip.id}>
                  <td className="p-4">{trip.pickup_location}</td>
                  <td className="p-4">{trip.destination}</td>
                  <td className="p-4 text-green-500">R {trip.fare}</td>
                  <td className="p-4">{trip.status}</td>
                  <td className="p-4 text-sm text-gray-400">{new Date(trip.start_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverHistory;