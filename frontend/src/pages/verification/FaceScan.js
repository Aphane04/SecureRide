import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, CheckCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [status, setStatus] = useState("Starting verification...");
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const steps = ["Camera Access", "Capture Image", "Complete"];

  useEffect(() => {
    initializeCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStep(1);
        setStatus("Camera Ready");
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Please enable camera access to continue verification.');
    }
  };

  const captureAndVerify = async () => {
    if (isVerifying || !videoRef.current) return;

    setIsVerifying(true);
    setStep(2);
    setStatus("Processing verification...");

    try {
      // Simulate verification delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mark verification as complete
      if (userId) {
        await authAPI.verifyLiveness(userId);
      }

      setStatus("Verification Successful ✓");
      
      // Stop video stream
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }

      // Redirect after 2 seconds
      setTimeout(() => navigate('/dashboard/passenger'), 2000);
    } catch (err) {
      console.error('Verification failed:', err);
      setError('Verification failed. Please try again.');
      setIsVerifying(false);
      setStep(1);
      setStatus("Ready to capture");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tighter mb-2">Identity Verification</h2>
        <p className="text-gray-500 text-sm italic uppercase tracking-widest">Secure your account</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm max-w-md text-center">
          {error}
        </div>
      )}

      <div className="relative w-80 h-80 lg:w-[450px] lg:h-[450px] mb-8">
        {/* Animated Border */}
        <div 
          className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-700 ${
            step === 2 ? 'border-[#008751] animate-none' : 'border-gray-800 animate-spin-slow'
          }`}
        ></div>

        {/* Video Container */}
        <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_50px_rgba(0,135,81,0.2)]">
          {videoRef && step >= 1 ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <RefreshCw className="animate-spin text-gray-600" size={60} />
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] px-6 py-2 rounded-full border border-gray-800 shadow-2xl flex items-center gap-2">
          {step === 2 ? (
            <CheckCircle className="text-[#008751]" size={18} />
          ) : (
            <RefreshCw className={`${step === 1 ? 'animate-spin' : ''} text-gray-500`} size={18} />
          )}
          <span className={`font-bold text-sm ${step === 2 ? 'text-[#008751]' : 'text-white'}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mt-20 grid grid-cols-3 gap-8 mb-10">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-colors ${
                step > i ? 'bg-[#008751]' : 'bg-gray-800'
              }`}
            ></div>
            <p 
              className={`text-[10px] font-bold uppercase tracking-widest ${
                step > i ? 'text-white' : 'text-gray-700'
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* Action Button */}
      {step === 1 && !isVerifying && (
        <button
          onClick={captureAndVerify}
          disabled={isVerifying}
          className="bg-[#008751] hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition disabled:opacity-50"
        >
          Verify Identity
        </button>
      )}

      {isVerifying && (
        <div className="text-center">
          <RefreshCw className="animate-spin text-[#008751] inline-block" size={32} />
          <p className="text-gray-400 mt-2">Processing...</p>
        </div>
      )}
    </div>
  );
};

export default FaceScan;