import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle, ShieldCheck, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [instruction, setInstruction] = useState("Initializing Biometric Scanner...");
  const [step, setStep] = useState(0); // 0: Loading, 1: Ready, 2: Scanning, 3: Success
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  
  // Tracking which movements have been completed
  const [detectionStats, setDetectionStats] = useState({
    center: false,
    left: false,
    right: false
  });

  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);

  const cleanup = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStep(2);
          setInstruction("Look straight at the camera");
          startFaceDetection();
        };
      }
    } catch (err) {
      setError('Camera Access Denied. Please enable permissions.');
    }
  }, []);

  useEffect(() => {
    const loadModelsAndStart = async () => {
      try {
        let checks = 0;
        while (!window.faceapi && checks < 50) {
          await new Promise(r => setTimeout(r, 200));
          checks++;
        }
        if (!window.faceapi) throw new Error("AI Library failed to load.");

        const MODEL_URL = '/models';
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        setStep(1);
        initializeCamera();
      } catch (err) {
        setError("System Error: Biometric models unavailable.");
      }
    };
    loadModelsAndStart();
    return () => cleanup();
  }, [initializeCamera, cleanup]);

  const startFaceDetection = () => {
    if (!videoRef.current || !window.faceapi) return;

    detectionIntervalRef.current = setInterval(async () => {
      try {
        if (!videoRef.current || videoRef.current.paused) return;

        const detection = await window.faceapi
          .detectSingleFace(
            videoRef.current, 
            new window.faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 })
          )
          .withFaceLandmarks();

        if (detection) {
          setFaceDetected(true);
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          // Calculate horizontal orientation
          const eyeDist = rightEye[0].x - leftEye[0].x;
          const noseRelX = (nose[0].x - leftEye[0].x) / eyeDist;

          let currentPos = 'none';
          
          // Logic: Broaden thresholds to make detection easier
          if (noseRelX < 0.45) currentPos = 'right';
          else if (noseRelX > 0.55) currentPos = 'left';
          else currentPos = 'center';

          // Update stats and calculate progress
          setDetectionStats(prev => {
            const next = { ...prev };
            // User must look center first
            if (!next.center && currentPos === 'center') next.center = true;
            // Then turn left
            if (next.center && !next.left && currentPos === 'left') next.left = true;
            // Then turn right
            if (next.left && !next.right && currentPos === 'right') next.right = true;
            
            // Calculate progress based on true values
            const completedCount = Object.values(next).filter(Boolean).length;
            setVerificationProgress((completedCount / 3) * 100);
            
            return next;
          });

        } else {
          setFaceDetected(false);
        }
      } catch (err) {
        console.error("AI Error:", err);
      }
    }, 200);
  };

  // Watch for progress completion
  useEffect(() => {
    if (verificationProgress === 100) {
      handleComplete();
    }
    
    // Dynamic Instructions
    if (verificationProgress === 0) setInstruction("Look straight at the camera");
    else if (verificationProgress < 66) setInstruction("Slowly turn your head LEFT ←");
    else if (verificationProgress < 100) setInstruction("Slowly turn your head RIGHT →");
  }, [verificationProgress]);

  const handleComplete = async () => {
    clearInterval(detectionIntervalRef.current);
    setStep(3);
    setInstruction("Biometric Identity Confirmed");
    
    try {
      if (userId) await authAPI.verifyLiveness(userId);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error("Finalization failed:", err);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-green-100 flex flex-col">
      
      {/* 1. Navigation Header */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-1 cursor-pointer hover:opacity-60 transition-opacity" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
          <span className="text-xs font-bold uppercase tracking-tighter">Back</span>
        </div>
        <div className="flex items-center gap-2 text-[#008751]">
            <ShieldCheck size={18} />
            <span className="font-black text-xs tracking-tighter uppercase text-black">Security Step 03 / 03</span>
        </div>
      </nav>

      {/* 2. Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight text-black mb-2 uppercase">
              Face Verification
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              AI Liveness Detection • Secure Authentication
            </p>
          </div>

          {/* Camera Frame */}
          <div className="relative mb-10 group">
            {/* Viewfinder brackets */}
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-gray-200 rounded-tl-xl" />
            <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-gray-200 rounded-tr-xl" />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-gray-200 rounded-bl-xl" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-gray-200 rounded-br-xl" />

            <div className="relative aspect-square w-full bg-gray-50 rounded-full overflow-hidden border-8 border-white shadow-xl ring-1 ring-gray-100">
               <video
                 ref={videoRef}
                 autoPlay
                 muted
                 playsInline
                 className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-700 ${step === 3 ? 'opacity-20' : 'opacity-100'}`}
               />

               {/* Instruction Overlay */}
               {step === 2 && (
                 <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-white/80 to-transparent">
                   <p className="text-center text-xs font-black uppercase tracking-widest text-[#008751] animate-pulse">
                     {instruction}
                   </p>
                 </div>
               )}

               {/* Success State Overlay */}
               {step === 3 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#008751] rounded-full p-4 mb-4 shadow-xl">
                      <UserCheck size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-black tracking-tight">SUCCESSFUL</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Redirecting to Login...</p>
                 </div>
               )}
            </div>

            {/* Sync Badge */}
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full border shadow-lg flex items-center gap-2 transition-all bg-white ${
                faceDetected ? 'border-[#008751] text-[#008751]' : 'border-gray-100 text-gray-400'
            }`}>
                <RefreshCw size={12} className={faceDetected ? 'animate-spin' : ''} />
                <span className="text-[9px] font-black uppercase tracking-widest">
                    {faceDetected ? 'Biometric Sync' : 'Align Face'}
                </span>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Center', key: 'center' },
                { label: 'Left', key: 'left' },
                { label: 'Right', key: 'right' }
              ].map((task) => (
                <div key={task.key} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    detectionStats[task.key] ? 'bg-white border-[#008751] text-[#008751] shadow-sm' : 'bg-transparent border-gray-200 text-gray-300'
                }`}>
                    <CheckCircle2 size={16} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{task.label}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verification Status</span>
                <span className="text-lg font-black text-black">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-[#008751] transition-all duration-700"
                    style={{ width: `${verificationProgress}%` }}
                />
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 text-red-500 justify-center">
              <AlertCircle size={14} />
              <span className="text-[10px] font-bold uppercase">{error}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FaceScan;