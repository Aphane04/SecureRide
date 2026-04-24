import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

const FaceScan = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState("Initializing AI...");
  const [step, setStep] = useState(0); // 0: Straight, 1: Left, 2: Right, 3: Success
  const [loading, setLoading] = useState(true);

  const steps = ["Look Straight", "Turn Head Left", "Turn Head Right"];

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      startVideo();
    };
    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        setLoading(false);
        setStatus(steps[0]);
      })
      .catch((err) => console.error(err));
  };

  const handleVideoPlay = () => {
    setInterval(async () => {
      if (!videoRef.current) return;
      
      const detections = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (detections) {
        const landmarks = detections.landmarks;
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();

        // Liveness Logic based on relative nose position to jaw
        const noseX = nose[0].x;
        const jawWidth = jaw[16].x - jaw[0].x;
        const relativePos = (noseX - jaw[0].x) / jawWidth;

        if (step === 0 && relativePos > 0.4 && relativePos < 0.6) {
          setStep(1); setStatus(steps[1]);
        } else if (step === 1 && relativePos < 0.3) {
          setStep(2); setStatus(steps[2]);
        } else if (step === 2 && relativePos > 0.7) {
          setStep(3); setStatus("Verification Successful");
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tighter mb-2">Live Identity Verification</h2>
        <p className="text-gray-500 text-sm italic uppercase tracking-widest">Ensuring you are a real person</p>
      </div>

      <div className="relative w-80 h-80 lg:w-[450px] lg:h-[450px]">
        {/* Modern Scanning HUD */}
        <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-700 ${step === 3 ? 'border-[#008751] animate-none' : 'border-gray-800 animate-spin-slow'}`}></div>
        
        <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_50px_rgba(0,135,81,0.2)]">
          <video ref={videoRef} onPlay={handleVideoPlay} autoPlay muted className="w-full h-full object-cover grayscale brightness-110" />
        </div>

        {/* Status Indicator Overlay */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] px-8 py-3 rounded-full border border-gray-800 shadow-2xl flex items-center gap-3">
          {step === 3 ? <UserCheck className="text-[#008751]" /> : <RefreshCw className="animate-spin text-gray-500" size={18} />}
          <span className={`font-bold text-sm ${step === 3 ? 'text-[#008751]' : 'text-white'}`}>{status}</span>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
             <div className={`w-3 h-3 rounded-full ${step >= i ? 'bg-[#008751]' : 'bg-gray-800'}`}></div>
             <p className={`text-[10px] font-bold uppercase tracking-widest ${step >= i ? 'text-white' : 'text-gray-700'}`}>{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaceScan;