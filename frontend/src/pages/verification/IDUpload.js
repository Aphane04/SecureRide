import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UploadCloud, ChevronLeft, FileText, CheckCircle2 } from 'lucide-react';
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

      // 1. Upload to backend
      await authAPI.uploadId(userId, formData);
      
      // 2. MOVE TO FACE SCAN
      navigate('/verify/face-scan', { state: { userId } });
    } catch (err) {
      console.error("Upload Error:", err);
      // For demo purposes, if backend fails, we still allow moving forward
      // To force strict mode, remove the navigate line below
      navigate('/verify/face-scan', { state: { userId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-green-100 flex flex-col">
      
      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-5xl mx-auto w-full">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-tighter">Back</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-black text-xs tracking-tighter uppercase text-gray-400">Step 02 / 03</span>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-black mb-2 uppercase">
              Upload Identity
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Verification • Secure Storage • Encryption
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 shadow-sm">
            <p className="text-xs text-gray-500 leading-relaxed text-center mb-8">
                Please upload a clear photo or PDF of your <strong>National ID or Driver's License</strong>. Ensure all text is legible.
            </p>

            {/* Modern Upload Zone */}
            <label className={`relative group border-2 border-dashed rounded-[1.5rem] p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                file ? 'border-[#008751] bg-green-50/30' : 'border-gray-200 hover:border-[#008751] hover:bg-gray-100'
            }`}>
              {file ? (
                <CheckCircle2 className="text-[#008751] mb-3 animate-in zoom-in" size={40} />
              ) : (
                <UploadCloud className="text-gray-300 group-hover:text-[#008751] mb-3 transition-colors" size={40} />
              )}
              
              <p className="text-xs font-bold text-black uppercase tracking-tight">
                {file ? file.name : 'Choose File to Upload'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-medium">
                JPG, PNG or PDF (Max 5MB)
              </p>

              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>

            {/* Action Button */}
            <button
              onClick={submitId}
              disabled={loading || !file}
              className="mt-8 w-full bg-black hover:bg-[#008751] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    SECURELY UPLOADING...
                </div>
              ) : "Continue to Face Scan"}
            </button>
          </div>

          {/* Footer Security Badge */}
          <div className="mt-10 flex flex-col items-center gap-2 opacity-30 grayscale">
            <div className="flex items-center gap-3">
               <FileText size={14} />
               <span className="text-[8px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
            </div>
            <p className="text-[7px] font-medium uppercase text-center px-10">
                Your documents are used solely for identity validation and are stored on isolated safety servers.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IDUpload;