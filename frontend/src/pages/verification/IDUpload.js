import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { authAPI } from '../../utils/api';

const IDUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitId = async () => {
    if (!userId) return alert("User ID missing. Please register again.");
    if (!file) return alert("Please select a file.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      await authAPI.uploadId(userId, formData);
      navigate('/verify/face-scan', { state: { userId } });
    } catch (err) {
      alert(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#121212] p-10 rounded-2xl border border-gray-800">
        <h2 className="text-2xl font-bold text-green-500 mb-6">Upload ID Document</h2>

        <label className="border-2 border-dashed border-gray-800 p-10 rounded-3xl text-center cursor-pointer hover:border-[#008751] transition block">
          <UploadCloud className="mx-auto mb-4 text-gray-600" size={32} />
          <p className="text-xs text-gray-400 font-bold uppercase">
            {file ? file.name : 'Click to upload ID / License'}
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <button
          onClick={submitId}
          disabled={loading}
          className="mt-6 w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold transition disabled:opacity-60"
        >
          {loading ? 'Uploading...' : 'Continue to Face Scan'}
        </button>
      </div>
    </div>
  );
};

export default IDUpload;