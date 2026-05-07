import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { ChevronLeft, ShieldCheck } from 'lucide-react';

const Consent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId; // Retrieve userId from previous registration step
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!userId) return alert("User ID missing. Please register again.");
    
    // We try to tell the backend, but we don't WAIT for it.
    // This ensures the user always goes to the next page.
    authAPI.recordConsent(userId).catch(err => console.log("Backend sync failed, but continuing..."));
    
    // GO TO FACE SCAN IMMEDIATELY
    navigate('/verify/id_upload', { state: { userId } });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-green-100">
      
      {/* Navigation Header */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-5xl mx-auto">
        <div 
          className="flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity" 
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-tighter">Back</span>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#008751] rounded flex items-center justify-center text-white">
                <ShieldCheck size={12} />
            </div>
            <span className="font-black text-xs tracking-tighter uppercase">SecureRide Legal</span>
        </div>
      </nav>

      {/* Compact Title Section */}
      <div className="text-center pt-8 pb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black mb-2 uppercase">
          Consent Form and Policy
        </h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Legal Framework • Data Privacy • Safety Standards
        </p>
      </div>

      {/* Document Content */}
      <div className="max-w-3xl mx-auto px-6 pb-20">
        
        <div className="bg-gray-50 p-4 rounded-xl mb-10 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed text-center italic">
            Please review the following safety protocols and data handling rules. Your agreement is required to activate the AI-monitored features of your SecureRide account.
          </p>
        </div>

        <div className="space-y-8">
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

        {/* Action Section */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col items-center">
          <div className="mb-6 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Confirmation Required</p>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                  By clicking accept, you voluntarily agree to the SecureRide data processing terms.
              </p>
          </div>
          
          <button 
            onClick={handleConsent}
            disabled={loading}
            className="w-full max-w-xs bg-black hover:bg-[#008751] text-white py-3.5 rounded-lg font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "SAVING..." : "CONFIRM & ACCEPT"}
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