import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

const Consent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve the userId passed from the Register page
  const userId = location.state?.userId; 
  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false); // State to track the checkbox

  const handleConsent = async () => {
    // Safety check: if userId is missing, we can't link the consent to an account
    if (!userId) {
        alert("Session Error: User ID not found. Please restart the registration.");
        return navigate('/register');
    }

    setLoading(true);
    try {
      // 1. Record the consent in the database
      await authAPI.recordConsent(userId);
      
      // 2. MOVE TO THE NEXT STEP: ID Upload
      navigate('/verify/id-upload', { state: { userId } });

    } catch (err) {
      console.error("Consent Sync Error:", err);
      // For demo purposes, we still move forward even if backend sync is slow
      navigate('/verify/id-upload', { state: { userId } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-green-100 flex flex-col">
      
      {/* 1. Slim Navigation Header */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-5xl mx-auto w-full">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-tighter text-gray-500">Back</span>
        </div>
        <div className="flex items-center gap-2 text-[#008751]">
            <ShieldCheck size={18} />
            <span className="font-black text-xs tracking-tighter uppercase text-black">Compliance Terminal</span>
        </div>
      </nav>

      {/* 2. Compact Title Section */}
      <div className="text-center pt-8 pb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black mb-2 uppercase">
          Consent Form and Policy
        </h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Legal Framework • Data Privacy • Safety Standards
        </p>
      </div>

      {/* 3. Document Content */}
      <div className="max-w-3xl mx-auto px-6 pb-20 flex-1">
        
        <div className="bg-gray-50 p-4 rounded-xl mb-10 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed text-center italic">
            Please review the following safety protocols and data handling rules. Your agreement is required to proceed to the identity verification stage.
          </p>
        </div>

        <div className="space-y-8">
          {/* Section 1 */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#008751]">
                  01. Biometric Identity
                </h2>
            </div>
            <div className="md:col-span-8">
                <p className="text-xs text-gray-600 leading-relaxed">
                    SecureRide collects a 3D facial map during registration. This biometric hash is used exclusively to verify that the person requesting or providing a ride matches the legal documentation on file. Data is encrypted and never shared with marketing third-parties.
                </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-gray-50 pt-8">
            <div className="md:col-span-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#008751]">
                  02. AI Monitoring
                </h2>
            </div>
            <div className="md:col-span-8">
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                    Active trips are monitored by our <strong>AI Safety Guard</strong>. By continuing, you consent to:
                </p>
                <ul className="text-[11px] space-y-2 text-gray-500 font-medium">
                    <li className="flex gap-2"><span>•</span> Real-time GPS coordinate tracking for emergency dispatch.</li>
                    <li className="flex gap-2"><span>•</span> Ambient audio analysis to detect distress signals or conflict keywords.</li>
                    <li className="flex gap-2"><span>•</span> Instant sharing of trip data with law enforcement if a high-level alert is triggered.</li>
                </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t border-gray-50 pt-8">
            <div className="md:col-span-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-[#008751]">
                  03. Rules of Conduct
                </h2>
            </div>
            <div className="md:col-span-8">
                <p className="text-xs text-gray-600 leading-relaxed">
                    Users must adhere to the SecureRide safety guidelines. Drivers must maintain updated vehicle images and licensing. Passengers must not interfere with the AI monitoring hardware. Any violation may result in permanent account termination.
                </p>
            </div>
          </section>
        </div>

        {/* 4. Action Section with Checkbox */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
          
          {/* CONSENT CHECKBOX */}
          <div className="mb-8 flex items-start gap-3 max-w-sm">
            <input 
                type="checkbox" 
                id="consent"
                className="mt-1 w-4 h-4 rounded border-gray-300 text-[#008751] focus:ring-[#008751] cursor-pointer"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
            />
            <label htmlFor="consent" className="text-[11px] text-gray-500 leading-snug cursor-pointer select-none">
                I have read the Consent Form and Policy and I voluntarily agree to the SecureRide data processing terms and rules of conduct.
            </label>
          </div>
          
          <button 
            onClick={handleConsent}
            disabled={loading || !isChecked} // Button is disabled if box is NOT checked
            className={`w-full max-w-xs py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                isChecked && !loading 
                ? 'bg-black hover:bg-[#008751] text-white cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? (
                <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    UPLOADING...
                </div>
            ) : "CONTINUE"}
          </button>
          
          <div className="mt-6 flex items-center gap-4 opacity-30 grayscale">
            <span className="text-[8px] font-black uppercase tracking-tighter">POPIA COMPLIANT</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">GDPR SECURE</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">AI-ENCRYPTED</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Consent;