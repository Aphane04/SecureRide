import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';

const IDUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [docType, setDocType] = useState('ID');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Revoke the object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    if (selected.type.startsWith('image/')) {
      // Revoke previous URL before creating a new one
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(selected));
    } else {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const handleNext = async () => {
    if (!file) {
      setError('Please select a document to upload.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (userId) {
        await authAPI.uploadId(userId, file, docType);
      }
      navigate('/verify/face-scan', { state: { userId } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white">
      <div className="max-w-md w-full bg-[#121212] p-8 rounded-xl text-center shadow-xl border border-gray-900">
        <h2 className="text-2xl font-bold mb-2">Identity Document</h2>
        <p className="text-gray-400 mb-8">Please upload a clear photo of your document</p>

        <select
          className="w-full bg-black p-3 mb-6 rounded border border-gray-800"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        >
          <option value="ID">National ID Card</option>
          <option value="Passport">International Passport</option>
        </select>

        <div className="border-2 border-dashed border-gray-700 p-10 rounded-lg mb-4 hover:border-green-500 transition cursor-pointer">
          <input
            type="file"
            className="hidden"
            id="fileUp"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileChange}
          />
          <label htmlFor="fileUp" className="cursor-pointer">
            {preview ? (
              <img
                src={preview}
                alt="Document preview"
                className="mx-auto max-h-40 rounded"
              />
            ) : (
              <>
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-500">
                  {file ? file.name : `Tap to upload ${docType} photo`}
                </p>
              </>
            )}
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full bg-[#008751] py-3 rounded font-bold hover:bg-green-700 disabled:opacity-60 transition"
        >
          {loading ? 'Uploading...' : 'Next: Facial Verification'}
        </button>
      </div>
    </div>
  );
};

export default IDUpload;