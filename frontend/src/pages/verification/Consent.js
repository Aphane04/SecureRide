import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const Consent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!userId) return alert("User ID missing. Please register again.");
    setLoading(true);
    try {
      await authAPI.recordConsent(userId);
      navigate('/verify/id-upload', { state: { userId } });
    } catch (err) {
      alert(err.response?.data?.detail || "Consent failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl bg-[#121212] p-10 rounded-lg border border-gray-800">
        <h2 className="text-2xl font-bold text-green-500 mb-6">Legal Consent & Rules</h2>
        <div className="text-gray-400 space-y-4 h-64 overflow-y-scroll mb-6 p-4 bg-black rounded">
          <p>
            1. All rides conducted through the SecureRide platform are continuously monitored by our AI-powered safety system...
          </p>
          <p>
            2. During active trips, certain data including audio signals (where applicable and legally permitted), GPS location...
          </p>
          <p>
            3. In the event of a reported incident, suspected unlawful activity, or where required by applicable law...
          </p>
          <p>
            4. All drivers operating on the SecureRide platform are required to maintain a valid driving license...
          </p>
          <p>
            5. By using the SecureRide platform, users acknowledge and consent to the collection and processing of data...
          </p>
        </div>
        <button
          onClick={handleConsent}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold transition disabled:opacity-60"
        >
          {loading ? 'Saving...' : 'I AGREE & CONTINUE'}
        </button>
      </div>
    </div>
  );
};

export default Consent;