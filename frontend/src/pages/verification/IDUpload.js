import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const IDUpload = () => {
  const navigate = useNavigate();
  const [docType, setDocType] = useState('ID');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-[#121212] p-8 rounded-xl text-center shadow-xl border border-gray-900">
        <h2 className="text-2xl font-bold mb-2">Identity Document</h2>
        <p className="text-gray-400 mb-8">Please upload a clear photo of your document</p>
        
        <select 
          className="w-full bg-black p-3 mb-6 rounded border border-gray-800"
          onChange={(e) => setDocType(e.target.value)}
        >
          <option value="ID">National ID Card</option>
          <option value="Passport">International Passport</option>
        </select>

        <div className="border-2 border-dashed border-gray-700 p-10 rounded-lg mb-6 hover:border-green-500 transition cursor-pointer">
          <input type="file" className="hidden" id="fileUp" />
          <label htmlFor="fileUp" className="cursor-pointer">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm text-gray-500">Tap to upload {docType} photo</p>
          </label>
        </div>

        <button 
          onClick={() => navigate('/verify/face-scan')}
          className="w-full bg-[#008751] py-3 rounded font-bold hover:bg-green-700">
          Next: Facial Verification
        </button>
      </div>
    </div>
  );
};

export default IDUpload;