import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle, ShieldCheck, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [instruction, setInstruction] = useState("Align face to start");
  const [step, setStep] = useState(0); 
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [detectionStats, setDetectionStats] = useState({ center: false, left: false, right: false });

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
          startFaceDetection();
        };
      }
    } catch (err) {
      setError('Camera Access Denied.');
    }
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        let checks = 0;
        while (!window.faceapi && checks < 50) {
          await new Promise(r => setTimeout(r, 200));
          checks++;
        }
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          window.faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        ]);
        setStep(1);
        initializeCamera();
      } catch (err) {
        setError("AI Models unavailable.");
      }
    };
    loadModels();
    return () => cleanup();
  }, [initializeCamera, cleanup]);

  const startFaceDetection = () => {
    if (!videoRef.current || !window.faceapi) return;

    detectionIntervalRef.current = setInterval(async () => {
      try {
        if (!videoRef.current || videoRef.current.paused) return;

        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.4 }))
          .withFaceLandmarks();

        if (detection) {
          setFaceDetected(true);
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const eyeDist = rightEye[0].x - leftEye[0].x;
          const noseRelX = (nose[0].x - leftEye[0].x) / eyeDist;

          let currentPos = 'none';
          // Looser thresholds for easier detection
          if (noseRelX < 0.44) currentPos = 'right';
          else if (noseRelX > 0.56) currentPos = 'left';
          else currentPos = 'center';

          setDetectionStats(prev => {
            const next = { ...prev };
            if (!next.center && currentPos === 'center') next.center = true;
            if (next.center && !next.left && currentPos === 'left') next.left = true;
            if (next.left && !next.right && currentPos === 'right') next.right = true;
            
            const completedCount = Object.values(next).filter(Boolean).length;
            const newProgress = (completedCount / 3) * 100;
            if (newProgress !== verificationProgress) setVerificationProgress(newProgress);
            
            return next;
          });
        } else {
          setFaceDetected(false);
        }
      } catch (err) { console.error(err); }
    }, 150);
  };

  useEffect(() => {
    if (verificationProgress === 100) handleComplete();
    if (verificationProgress === 0) setInstruction("Look straight at the camera");
    else if (verificationProgress < 66) setInstruction("Slowly turn your head LEFT ←");
    else if (verificationProgress < 100) setInstruction("Slowly turn your head RIGHT →");
  }, [verificationProgress]);

  const handleComplete = async () => {
    clearInterval(detectionIntervalRef.current);
    setStep(3);
    setInstruction("Identity Confirmed");
    try {
      if (userId) await authAPI.verifyLiveness(userId);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-black flex flex-col overflow-hidden">
      
      {/* 1. Header */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-100 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => navigate(-1)}>
          <ChevronLeft size={16} />
          <span className="text-[10px] font-bold uppercase">Back</span>
        </div>
        <div className="flex items-center gap-2 text-[#008751]">
            <ShieldCheck size={16} />
            <span className="font-black text-[10px] tracking-widest uppercase text-black">Step 03 / 03</span>
        </div>
      </nav>

      {/* 2. Compact Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full">
          
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-black uppercase tracking-tight">Biometric Scan</h1>
            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.2em]">Face Liveness Detection</p>
          </div>

          {/* 3. Instruction Banner (Outside Circle) */}
          <div className={`mb-4 py-2 px-4 rounded-xl border text-center transition-all ${
            faceDetected ? 'bg-[#1a1a1a] text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-100'
          }`}>
            <p className="text-xs font-bold uppercase tracking-widest leading-none">
              {faceDetected ? instruction : "Face not detected"}
            </p>
          </div>

          {/* 4. Reduced Camera Viewfinder */}
          <div className="relative mb-6 mx-auto w-64 h-64 md:w-72 md:h-72">
            <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-gray-200 rounded-tl-lg" />
            <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-gray-200 rounded-tr-lg" />
            <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-gray-200 rounded-bl-lg" />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-gray-200 rounded-br-lg" />

            <div className="relative w-full h-full bg-gray-50 rounded-full overflow-hidden border-4 border-white shadow-lg ring-1 ring-gray-100">
               <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-cover scale-x-[-1] ${step === 3 ? 'opacity-10' : 'opacity-100'}`} />
               
               {step === 3 && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="bg-[#008751] rounded-full p-3 mb-2 shadow-lg"><UserCheck size={30} className="text-white" /></div>
                    <h3 className="text-sm font-black text-black uppercase">Verified</h3>
                 </div>
               )}
            </div>

            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full border shadow flex items-center gap-2 bg-white transition-all ${
                faceDetected ? 'border-[#008751] text-[#008751]' : 'border-gray-100 text-gray-400'
            }`}>
                <RefreshCw size={10} className={faceDetected ? 'animate-spin' : ''} />
                <span className="text-[8px] font-black uppercase tracking-widest">{faceDetected ? 'Synced' : 'Aligning'}</span>
            </div>
          </div>

          {/* 5. Compact Progress Card */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['center', 'left', 'right'].map((k) => (
                <div key={k} className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border transition-all ${
                    detectionStats[k] ? 'bg-white border-[#008751] text-[#008751]' : 'bg-transparent border-gray-200 text-gray-300'
                }`}>
                    <CheckCircle2 size={12} />
                    <span className="text-[8px] font-black uppercase">{k}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-1 px-1">
                <span className="text-[8px] font-bold text-gray-400 uppercase">Verification Progress</span>
                <span className="text-xs font-black text-black">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#008751] transition-all duration-700" style={{ width: `${verificationProgress}%` }} />
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-500 justify-center">
              <AlertCircle size={12} />
              <span className="text-[8px] font-black uppercase">{error}</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FaceScan;