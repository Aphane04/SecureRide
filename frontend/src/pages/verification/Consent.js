import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { ChevronLeft, Shield } from 'lucide-react';

const Consent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;
  const [loading, setLoading] = useState(false);

  const handleConsent = async () => {
    if (!userId) return alert("Session expired. Please register again.");
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
    <div className="min-h-screen bg-[#0a0a0a] font-sans relative">
      
      {/* 1. Static Dark Header */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate(-1)}>
          <ChevronLeft className="text-gray-500 group-hover:text-white transition-colors" size={20} />
          <span className="text-gray-500 group-hover:text-white text-sm font-medium transition-colors">Back to Register</span>
        </div>
        <div className="flex items-center gap-2">
            <Shield className="text-[#008751]" size={20} />
            <span className="text-white font-black tracking-tighter uppercase text-sm">SecureRide Compliance</span>
        </div>
      </nav>

      {/* 2. Page Title */}
      <div className="relative z-10 text-center pt-12 pb-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Consent Form and Policy
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em]">
          Legal Framework • Data Privacy • Safety Standards
        </p>
      </div>

      {/* 3. The White Document Area */}
      <div className="relative z-10 bg-white rounded-t-[3rem] md:rounded-t-[5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-3xl mx-auto px-8 py-20 text-[#1a1a1a]">
          
          <div className="mb-16 pb-8 border-b border-gray-100">
            <p className="text-sm text-gray-500 leading-relaxed italic">
              "By using the SecureRide platform, you acknowledge that our AI-driven safety systems require the collection of specific biometric and environmental data to function. This document serves as your formal consent to these processes."
            </p>
          </div>

          <div className="space-y-16">
            {/* Section 1 */}
            <section>
              <h2 className="text-2xl font-black text-black mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#008751] rounded-full" />
                Information We Collect
              </h2>
              <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                <p>
                  <strong>1. Biometric Identity:</strong> To ensure the highest level of security, we collect a high-resolution 3D facial map. This is used only to verify that the person accessing the account matches the legal identity documents provided.
                </p>
                <p>
                  <strong>2. Identity Documentation:</strong> We require images of Government-issued IDs. These are stored using AES-256 encryption and are accessible only by authorized security personnel during verification audits.
                </p>
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-2xl font-black text-black mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#008751] rounded-full" />
                AI Monitoring & Safety
              </h2>
              <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
                <p>
                  SecureRide utilizes a proprietary <strong>AI Safety Monitor</strong>. During an active trip, the system analyzes ambient audio signals to detect "Danger Keywords" (e.g., help, stop, weapon). 
                </p>
                <ul className="space-y-4 pl-4 border-l-2 border-green-50">
                    <li><span className="text-[#008751] font-bold">●</span> Real-time GPS tracking is mandatory for all active trips.</li>
                    <li><span className="text-[#008751] font-bold">●</span> Audio analysis is processed locally and discarded unless a safety alert is triggered.</li>
                    <li><span className="text-[#008751] font-bold">●</span> Metadata regarding trip duration and route is stored for user trip history.</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-2xl font-black text-black mb-6 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-[#008751] rounded-full" />
                Agreements & Conduct
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed">
                <p>
                  Users agree to maintain professional conduct. Drivers must maintain valid licenses and vehicle insurance. Passengers agree to adhere to safety guidelines. Any violation of these rules, detected by AI or reported manually, may lead to immediate account suspension and legal review.
                </p>
              </div>
            </section>
          </div>

          {/* 4. Action Section (Button changed from Blue to Green) */}
          <div className="mt-24 pt-12 border-t border-gray-100 flex flex-col items-center">
            <div className="mb-8 text-center">
                <p className="text-xs font-bold text-[#008751] uppercase tracking-widest mb-2">Final Confirmation</p>
                <p className="text-sm text-gray-400 max-w-sm">
                    Clicking the button below confirms your agreement to the SecureRide Data & Safety Policy.
                </p>
            </div>
            
            <button 
              onClick={handleConsent}
              disabled={loading}
              className="w-full max-w-md bg-[#1a1a1a] hover:bg-[#008751] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Saving Consent...
                </div>
              ) : "I Agree and Continue"}
            </button>
            
            <p className="mt-8 text-[10px] text-gray-300 font-medium uppercase tracking-tighter">
                SecureRide Terminal • Document ID: {userId || 'NEW_USER'} • v2026.01
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Consent;