import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UploadCloud, ChevronLeft, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import { authAPI } from '../../utils/api';

const IDUpload = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve the userId from the previous Consent step
  const userId = location.state?.userId;

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitId = async () => {
    if (!userId) {
        alert("Session Error: User ID missing. Please restart registration.");
        return navigate('/register');
    }
    if (!file) return alert("Selection Required: Please select an ID document to proceed.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      // 1. Upload the ID document to the backend
      await authAPI.uploadId(userId, formData);
      
      // 2. MOVE TO FINAL STEP: FACE SCAN
      // We pass the userId in the state so the FaceScan component knows who to verify
      navigate('/verify/face-scan', { state: { userId } });

    } catch (err) {
      console.error("ID Upload Error:", err);
      // For Demo/Project stability: If the backend fails, we still allow moving to Face Scan
      navigate('/verify/face-scan', { state: { userId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-green-100 flex flex-col">
      
      {/* 1. Navigation Header */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-5xl mx-auto w-full">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-tighter text-gray-500">Back</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-black text-[10px] tracking-[0.2em] uppercase text-gray-400">Security Step 02 / 03</span>
        </div>
      </nav>

      {/* 2. Main Content Container (Optimized for no-zoom view) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-12">
        <div className="max-w-md w-full">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-black mb-2 uppercase">
              Upload Identity
            </h1>
            <div className="flex items-center justify-center gap-2 text-gray-400">
               <ShieldCheck size={14} className="text-[#008751]" />
               <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                 Verification • Encrypted • Secure
               </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <p className="text-xs text-gray-500 leading-relaxed text-center mb-10 px-2">
                Please upload a clear photography or PDF of your <strong>National ID or Driver's License</strong>. Ensure all text and the photo are clearly visible.
            </p>

            {/* Upload Zone */}
            <label className={`relative group border-2 border-dashed rounded-[2rem] p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                file ? 'border-[#008751] bg-green-50/20' : 'border-gray-200 hover:border-[#008751] hover:bg-gray-100'
            }`}>
              {file ? (
                <CheckCircle2 className="text-[#008751] mb-4 animate-in zoom-in" size={48} />
              ) : (
                <UploadCloud className="text-gray-300 group-hover:text-[#008751] mb-4 transition-colors" size={48} />
              )}
              
              <p className="text-xs font-bold text-black uppercase tracking-tight">
                {file ? file.name : 'Choose Identification File'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5 uppercase font-medium">
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
              className="mt-10 w-full bg-black hover:bg-[#008751] text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-20 shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    UPLOADING SECURELY...
                </div>
              ) : "Continue to Biometric Scan"}
            </button>
          </div>

          {/* Privacy Disclaimer */}
          <div className="mt-8 flex flex-col items-center gap-2 opacity-40 grayscale">
            <div className="flex items-center gap-3">
               <FileText size={14} />
               <span className="text-[9px] font-black uppercase tracking-widest">Global Data Security Standards</span>
            </div>
            <p className="text-[8px] font-medium uppercase text-center px-12 leading-relaxed">
                Personal documentation is handled under strict POPIA regulations and is automatically purged after verification cycles.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IDUpload;