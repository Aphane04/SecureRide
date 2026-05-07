import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { ChevronLeft } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0a0c10] font-sans relative overflow-x-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#008751] opacity-20 blur-[120px] rounded-full" />
      </div>

      {/* Header Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(-1)}>
          <ChevronLeft className="text-gray-400" size={20} />
          <span className="text-gray-400 text-sm font-medium">Back</span>
        </div>
        <div className="flex gap-8 text-gray-400 text-sm font-medium">
          <span className="hover:text-white cursor-pointer transition-colors">Home</span>
          <span className="hover:text-white cursor-pointer transition-colors">Safety</span>
          <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
        </div>
        <button className="bg-white/10 hover:bg-white/20 text-white px-5 py-2 rounded-full text-xs font-bold transition-all border border-white/10 backdrop-blur-md">
          Help Center
        </button>
      </nav>

      {/* Top Title Section */}
      <div className="relative z-10 text-center pt-20 pb-24">
        <h1 className="text-5xl font-bold text-white tracking-tight mb-4">
          Consent Form and Policy
        </h1>
        <p className="text-gray-500 text-sm font-medium">
          Last updated on May 07, 2026
        </p>
      </div>

      {/* Main Document Body (White Content Area) */}
      <div className="relative z-10 bg-white rounded-t-[4rem] min-h-screen shadow-[0_-20px_80px_rgba(0,0,0,0.4)]">
        <div className="max-w-3xl mx-auto px-8 py-20 text-[#333] leading-relaxed">
          
          <p className="text-sm text-gray-500 mb-12">
            SecureRide is dedicated to protecting your personal information and respecting your privacy. This Document outlines the types of biometric and trip data we collect, how we use it, and your legal rights regarding that information. By accessing or using our Services, you agree to the practices described in this Consent Form and Policy.
          </p>

          <h2 className="text-3xl font-bold text-black mb-6">Information We Collect</h2>
          <p className="text-sm text-gray-600 mb-8">We collect different types of personal and safety information depending on your role within the platform.</p>

          <div className="space-y-12">
            {/* Section 1 */}
            <section>
              <h3 className="text-xl font-bold text-black mb-4">1. Personal Information You Provide to Us</h3>
              <p className="text-sm text-gray-600 mb-4">We may collect the following types of information that you voluntarily provide:</p>
              <ul className="list-disc pl-6 space-y-3 text-sm text-gray-600">
                <li><strong>Account Information:</strong> When you register, we collect your full name, ID number, ethnicity, and gender to build your secure profile.</li>
                <li><strong>Contact Information:</strong> We store your mobile number and email to facilitate ride coordination and emergency notifications.</li>
                <li><strong>Biometric Data:</strong> During registration, a live 3D face scan is required to confirm identity and prevent account spoofing.</li>
                <li><strong>Emergency Contacts:</strong> Drivers and Passengers provide secondary contact details for automated safety protocols.</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="text-xl font-bold text-black mb-4">2. Information Collected Automatically</h3>
              <p className="text-sm text-gray-600 mb-4">During active trips, our AI safety infrastructure collects data automatically:</p>
              <ul className="list-disc pl-6 space-y-3 text-sm text-gray-600">
                <li><strong>AI Audio Monitoring:</strong> Our safety model monitors audio signals in real-time to detect keywords indicating distress, violence, or danger.</li>
                <li><strong>GPS Location Data:</strong> Precise location tracking is active for the duration of every trip for passenger and driver security.</li>
                <li><strong>Device Information:</strong> Details about the mobile device used to access the service to ensure session integrity.</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="text-xl font-bold text-black mb-4">How We Use Your Information</h3>
              <p className="text-sm text-gray-600 mb-4">We process the collected information to enhance safety and ensure the smooth functioning of our services:</p>
              <ul className="list-disc pl-6 space-y-3 text-sm text-gray-600">
                <li><strong>Identity Verification:</strong> Using biometric hashes to ensure the person behind the wheel or in the car is the authorized account holder.</li>
                <li><strong>Safety Intervention:</strong> Automatically alerting emergency services and law enforcement if the AI Monitor flags a critical safety violation.</li>
                <li><strong>Legal Compliance:</strong> Ensuring all operations adhere to local transport regulations and data protection acts (POPIA/GDPR).</li>
                <li><strong>Conflict Resolution:</strong> Reviewing AI transcripts and GPS logs to settle disputes or investigate reported incidents.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h3 className="text-xl font-bold text-black mb-4">Third Party Sharing</h3>
              <p className="text-sm text-gray-600">
                Your data is never sold to advertisers. Information is only shared with verified Law Enforcement Agencies (LEA) and your designated Emergency Contacts in the event of a high-severity safety alert.
              </p>
            </section>
          </div>

          {/* Action Button Section */}
          <div className="mt-20 pt-10 border-t border-gray-100 flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-6 text-center max-w-md">
              By clicking "Confirm & Accept", you provide explicit consent for biometric processing and AI trip monitoring as described above.
            </p>
            <button 
              onClick={handleConsent}
              disabled={loading}
              className="w-full max-w-sm bg-black hover:bg-[#008751] text-white py-4 rounded-xl font-bold text-sm transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "PROCESSING..." : "CONFIRM & ACCEPT"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Consent;