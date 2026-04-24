import React from 'react';
import { useNavigate } from 'react-router-dom';

const Consent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl bg-[#121212] p-10 rounded-lg border border-gray-800">
        <h2 className="text-2xl font-bold text-green-500 mb-6">Legal Consent & Rules</h2>
        <div className="text-gray-400 space-y-4 h-64 overflow-y-scroll mb-6 p-4 bg-black rounded">
          <p>1. All rides are monitored by SecureRide AI for safety.</p>
          <p>2. Audio and location data will be recorded in case of emergencies.</p>
          <p>3. Information captured will be shared with law enforcement if a crime is reported.</p>
          <p>4. Drivers must maintain a valid license at all times.</p>
        </div>
        <button 
          onClick={() => navigate('/verify/id-upload')}
          className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold transition">
          I AGREE & CONTINUE
        </button>
      </div>
    </div>
  );
};
export default Consent;