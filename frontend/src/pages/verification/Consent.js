import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { ShieldCheck, Scale, Eye, Fingerprint, Activity, ArrowRight } from 'lucide-react';

const Consent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!userId) return alert("System Error: User session expired. Please restart registration.");
    setLoading(true);
    try {
      await authAPI.recordConsent(userId);
      navigate('/verify/id-upload', { state: { userId } });
    } catch (err) {
      alert(err.response?.data?.detail || "Consent recording failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-green-500 py-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* 1. Header Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 text-green-500 mb-4">
             <ShieldCheck size={24} />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Legal & Compliance</span>
          </div>
          <h1 className="text-6xl font-black tracking-tighter mb-4 italic">USER CONSENT FORM</h1>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
            Biometric Data, AI Monitoring & Global Privacy Standards
          </p>
        </div>

        {/* 2. Structured Content - Editorial Style */}
        <div className="space-y-16 mb-20 border-t border-white/10 pt-16">
          
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-3 md:col-span-1">
                <Fingerprint className="text-gray-600" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Biometric Data</h3>
            </div>
            <div className="md:col-span-2">
                <p className="text-gray-400 text-sm leading-relaxed">
                    You agree to provide a live facial scan for identity verification. SecureRide uses 3D mapping and liveness detection algorithms to ensure your profile matches your legal identification. This data is converted into an encrypted biometric hash and stored securely to prevent account impersonation.
                </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-3 md:col-span-1">
                <Activity className="text-gray-600" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">AI Safety Monitoring</h3>
            </div>
            <div className="md:col-span-2">
                <p className="text-gray-400 text-sm leading-relaxed">
                    By proceeding, you consent to real-time AI audio analysis during active trips. Our safety model listens for high-stress keywords and danger signals to automatically trigger emergency response. No raw audio files are permanently stored unless an incident is flagged for manual review.
                </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-3 md:col-span-1">
                <Scale className="text-gray-600" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Data Compliance</h3>
            </div>
            <div className="md:col-span-2">
                <p className="text-gray-400 text-sm leading-relaxed">
                    Our processing activities comply with the <strong>Protection of Personal Information Act (POPIA)</strong> and the <strong>General Data Protection Regulation (GDPR)</strong>. You retain the right to access, rectify, or request the erasure of your personal records at any time through our Privacy Terminal.
                </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-3 md:col-span-1">
                <Eye className="text-gray-600" size={20} />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">Third Party Disclosure</h3>
            </div>
            <div className="md:col-span-2">
                <p className="text-gray-400 text-sm leading-relaxed">
                    Information including real-time GPS location and User Dossiers will only be shared with verified Law Enforcement Agencies (LEA) in the event of a critical safety alert or as required by a valid court order.
                </p>
            </div>
          </section>

        </div>

        {/* 3. Action Area */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 p-12 bg-white/5 border border-white/10 rounded-[3rem] shadow-2xl">
          <div className="max-w-md">
            <p className="text-white text-lg font-bold mb-2">Legal Confirmation</p>
            <p className="text-gray-500 text-xs leading-relaxed">
                By clicking the button, you acknowledge that you have read, understood, and voluntarily agree to the terms listed above.
            </p>
          </div>
          
          <button
            onClick={handleConsent}
            disabled={loading}
            className="group relative bg-white text-black hover:bg-green-600 hover:text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    Confirm & Accept
                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </>
            )}
          </button>
        </div>

        {/* 4. Footer Branding */}
        <div className="mt-20 text-center opacity-20">
            <p className="text-[10px] font-black uppercase tracking-[0.8em]">SecureRide Safety Protocol v4.0</p>
        </div>

      </div>
    </div>
  );
};

export default Consent;