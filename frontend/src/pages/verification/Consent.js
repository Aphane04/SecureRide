import React from 'react';
import { useNavigate } from 'react-router-dom';

const Consent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl bg-[#121212] p-10 rounded-lg border border-gray-800">
        <h2 className="text-2xl font-bold text-green-500 mb-6">Legal Consent & Rules</h2>
        <div className="text-gray-400 space-y-4 h-64 overflow-y-scroll mb-6 p-4 bg-black rounded">
          <p>
    1. All rides conducted through the SecureRide platform are continuously monitored by our AI-powered safety system to enhance user protection, detect potential risks, and support emergency response procedures where necessary.
  </p>

  <p>
    2. During active trips, certain data including audio signals (where applicable and legally permitted), GPS location, trip metadata, and safety-related interactions may be collected and securely stored. This information is used strictly for safety monitoring, incident analysis, and emergency support.
  </p>

  <p>
    3. In the event of a reported incident, suspected unlawful activity, or where required by applicable law, SecureRide may be obligated to share relevant trip data with authorized law enforcement agencies or regulatory bodies in accordance with data protection and privacy legislation.
  </p>

  <p>
    4. All drivers operating on the SecureRide platform are required to maintain a valid driving license, vehicle documentation, and any other regulatory requirements as mandated by local transport authorities. Failure to comply may result in suspension or removal from the platform.
  </p>

  <p>
    5. By using the SecureRide platform, users acknowledge and consent to the collection and processing of data as outlined above, strictly for purposes of safety, service improvement, legal compliance, and emergency response support.
  </p>
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