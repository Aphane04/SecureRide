import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle, ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Retrieve the userId passed through the chain (Register -> Consent -> ID Upload)
  const userId = location.state?.userId;

  const [instruction, setInstruction] = useState("Initializing Biometric Scanner...");
  const [step, setStep] = useState(0); // 0: Loading, 1: Ready, 2: Scanning, 3: Success
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
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
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStep(2);
          setInstruction("Align your face in the center");
          startFaceDetection();
        };
      }
    } catch (err) {
      setError('Sensor Access Denied. Please enable camera permissions.');
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

        // Models are served from the public/models directory
        const MODEL_URL = '/models';
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        setStep(1);
        initializeCamera();
      } catch (err) {
        setError("Encryption Error: Biometric models unavailable.");
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
            new window.faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.5 })
          )
          .withFaceLandmarks();

        if (detection) {
          setFaceDetected(true);
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          // Horizontal face orientation logic
          const eyeDist = rightEye[0].x - leftEye[0].x;
          const noseRelX = (nose[0].x - leftEye[0].x) / eyeDist;

          let currentPos = 'center';
          
          // Calibration: 0.5 is absolute center. < 0.45 is right, > 0.55 is left.
          if (noseRelX < 0.45) {
            currentPos = 'right';
          } else if (noseRelX > 0.55) {
            currentPos = 'left';
          } else {
            currentPos = 'center';
          }

          // Progress through the required movements sequentially
          setDetectionStats(prev => {
            const next = { ...prev };
            if (!next.center && currentPos === 'center') next.center = true;
            if (next.center && !next.left && currentPos === 'left') next.left = true;
            if (next.left && !next.right && currentPos === 'right') next.right = true;
            return next;
          });

          // Dynamic Instructions logic
          if (!detectionStats.center) {
            setInstruction("Look directly at the sensor");
          } else if (!detectionStats.left) {
            setInstruction("Slowly turn your head to the LEFT ←");
          } else if (!detectionStats.right) {
            setInstruction("Now slowly turn your head to the RIGHT →");
          }

          const progress = (Object.values(detectionStats).filter(Boolean).length / 3) * 100;
          setVerificationProgress(progress);

          // If all three checks are pass, trigger completion
          if (detectionStats.center && detectionStats.left && detectionStats.right) {
            handleComplete();
          }
        } else {
          setFaceDetected(false);
          if (step === 2) setInstruction("Face not detected. Improve lighting.");
        }
      } catch (err) {
        console.error("Biometric loop error:", err);
      }
    }, 150);
  };

  const handleComplete = async () => {
    clearInterval(detectionIntervalRef.current);
    setStep(3); // Enter Success UI State
    setInstruction("Biometric Integrity Confirmed");
    
    try {
      if (userId) {
        // PUSH TO DATABASE: Set is_verified = True for this user
        await authAPI.verifyLiveness(userId);
      }
      
      // FINAL REDIRECT: Registration complete, send to login
      setTimeout(() => navigate('/login'), 4000);

    } catch (err) {
      console.error("Verification Finalization Error:", err);
      setError("Registration finalized locally, but server sync failed.");
      // Fallback redirect if API fails during demo
      setTimeout(() => navigate('/login'), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      
      {/* Background ambience color change on success */}
      <div className={`fixed inset-0 transition-colors duration-1000 pointer-events-none ${
          step === 3 ? 'bg-green-950/20' : faceDetected ? 'bg-blue-950/10' : 'bg-transparent'
      }`} />

      {/* Identity Header */}
      <div className="mb-10 text-center z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <ShieldCheck size={14} className="text-[#008751]" />
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-400">Security Terminal v2.4</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-2 text-white">
            Identity Verification
        </h2>
      </div>

      {/* Main Instruction Panel */}
      <div className="w-full max-w-sm relative z-10 mb-10">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
           <p className={`text-lg font-bold tracking-tight transition-all duration-300 ${
             step === 3 ? 'text-green-400' : 'text-gray-100'
           }`}>
             {instruction}
           </p>
        </div>
      </div>

      {/* Alert Overlay */}
      {error && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-red-500/20 border border-red-500/50 backdrop-blur-xl px-8 py-3 rounded-full flex items-center gap-3 text-red-400 font-black text-xs uppercase tracking-widest">
                <AlertCircle size={18} /> {error}
            </div>
        </div>
      )}

      {/* Viewfinder Circle */}
      <div className="relative">
        <div className="absolute -top-3 -left-3 w-12 h-12 border-t-2 border-l-2 border-white/20 rounded-tl-3xl" />
        <div className="absolute -top-3 -right-3 w-12 h-12 border-t-2 border-r-2 border-white/20 rounded-tr-3xl" />
        <div className="absolute -bottom-3 -left-3 w-12 h-12 border-b-2 border-l-2 border-white/20 rounded-bl-3xl" />
        <div className="absolute -bottom-3 -right-3 w-12 h-12 border-b-2 border-r-2 border-white/20 rounded-br-3xl" />

        <div className="relative w-80 h-80 md:w-[460px] md:h-[460px]">
            <div className={`absolute inset-0 rounded-full border transition-all duration-700 ${
                faceDetected ? 'scale-105 border-green-500/40' : 'scale-100 border-white/5'
            }`} />

            <div className="absolute inset-4 rounded-full overflow-hidden bg-zinc-950 border-[8px] border-black shadow-[0_0_100px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-500 ${step === 3 ? 'opacity-20' : 'opacity-100'}`}
                />
                
                {/* Horizontal Scanline Animation */}
                {step === 2 && (
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/10 to-transparent h-[10%] w-full animate-scan" />
                )}

                {/* Direction Guides (Side Glows) */}
                {step === 2 && faceDetected && (
                  <div className="absolute inset-0 pointer-events-none flex justify-between">
                    <div className={`w-24 h-full bg-gradient-to-r from-green-500/20 to-transparent transition-opacity duration-300 ${detectionStats.center && !detectionStats.left ? 'opacity-100' : 'opacity-0'}`} />
                    <div className={`w-24 h-full bg-gradient-to-l from-green-500/20 to-transparent transition-opacity duration-300 ${detectionStats.left && !detectionStats.right ? 'opacity-100' : 'opacity-0'}`} />
                  </div>
                )}

                {/* SUCCESS OVERLAY SCREEN */}
                {step === 3 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent animate-in fade-in zoom-in duration-700">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-green-500 blur-3xl opacity-40 animate-pulse" />
                            <div className="relative bg-white rounded-full p-8 shadow-2xl">
                                <UserCheck size={60} className="text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">Verified</h3>
                        <div className="flex items-center gap-3 text-green-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                            <Loader2 size={16} className="animate-spin" />
                            Redirecting to login...
                        </div>
                    </div>
                )}
            </div>

            {/* Sync Badge */}
            {step === 2 && (
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-8 py-2.5 rounded-full border backdrop-blur-2xl shadow-2xl flex items-center gap-3 transition-all duration-500 ${
                    faceDetected ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'
                }`}>
                    <RefreshCw size={16} className={`${faceDetected ? 'animate-spin' : ''}`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">
                        {faceDetected ? 'Live Link Active' : 'Scanning Sensor...'}
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Verification Task Checklist */}
      <div className="mt-16 w-full max-w-xl z-10 px-4">
        <div className="grid grid-cols-3 gap-6 mb-12">
            {[
                { label: 'Neutral', key: 'center' },
                { label: 'Turn Left', key: 'left' },
                { label: 'Turn Right', key: 'right' }
            ].map((task) => (
                <div key={task.key} className={`relative flex flex-col items-center p-6 rounded-[2.5rem] border transition-all duration-700 ${
                    detectionStats[task.key] 
                    ? 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.15)]' 
                    : 'bg-white/5 border-white/5 text-gray-700'
                }`}>
                    <CheckCircle2 size={24} className={`mb-3 transition-all duration-500 ${detectionStats[task.key] ? 'scale-110 opacity-100' : 'opacity-20'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{task.label}</span>
                </div>
            ))}
        </div>

        {/* Completion Progress Slider */}
        <div className="relative px-2">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Sensor Verification</span>
                <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-4 w-full bg-white/5 rounded-full p-1 border border-white/10 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-green-800 via-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                        width: `${verificationProgress}%`,
                        boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
                    }}
                />
            </div>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-150%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(350%); opacity: 0; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FaceScan;