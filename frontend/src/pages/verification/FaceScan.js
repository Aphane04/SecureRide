import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [instruction, setInstruction] = useState("Initializing SecureScan...");
  const [step, setStep] = useState(0); 
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
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStep(2);
          setInstruction("Align your face within the frame");
          startFaceDetection();
        };
      }
    } catch (err) {
      setError('Biometric sensor access denied. Please enable camera permissions.');
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
        if (!window.faceapi) throw new Error("Library failed to load.");

        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          window.faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        ]);

        setStep(1);
        initializeCamera();
      } catch (err) {
        setError("System integrity check failed. Models unavailable.");
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
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection) {
          setFaceDetected(true);
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          const eyeDist = rightEye[0].x - leftEye[0].x;
          const noseRelX = (nose[0].x - leftEye[0].x) / eyeDist;

          let currentPos = 'center';
          if (noseRelX < 0.38) currentPos = 'right';
          else if (noseRelX > 0.62) currentPos = 'left';

          if (!detectionStats.center && currentPos === 'center') {
             setDetectionStats(prev => ({ ...prev, center: true }));
          } else if (detectionStats.center && !detectionStats.left && currentPos === 'left') {
             setDetectionStats(prev => ({ ...prev, left: true }));
          } else if (detectionStats.left && !detectionStats.right && currentPos === 'right') {
             setDetectionStats(prev => ({ ...prev, right: true }));
          }

          if (!detectionStats.center) {
            setInstruction("Look directly at the sensor");
          } else if (!detectionStats.left) {
            setInstruction("Slowly rotate head to the left");
          } else if (!detectionStats.right) {
            setInstruction("Slowly rotate head to the right");
          }

          const progress = (Object.values(detectionStats).filter(Boolean).length / 3) * 100;
          setVerificationProgress(progress);

          if (detectionStats.center && detectionStats.left && detectionStats.right) {
            handleComplete();
          }
        } else {
          setFaceDetected(false);
          if (step === 2) setInstruction("Face not detected. Improve lighting.");
        }
      } catch (err) {
        console.error(err);
      }
    }, 150);
  };

  const handleComplete = async () => {
    clearInterval(detectionIntervalRef.current);
    setStep(3);
    setInstruction("Biometric identity confirmed");
    
    try {
      if (userId) await authAPI.verifyLiveness(userId);
      // Wait to let them see the success state
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError("Cloud verification failed.");
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-green-500">
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] transition-all duration-1000 ${
            step === 3 ? 'bg-green-600/10' : faceDetected ? 'bg-green-900/5' : 'bg-blue-900/5'
        }`} />
      </div>

      {/* Header Section */}
      <div className="mb-12 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
            <ShieldCheck size={14} className="text-[#008751]" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400">SecureRide Auth v2.0</span>
        </div>
        <h2 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
            Identity Verification
        </h2>
      </div>

      {/* Modern Instruction Box */}
      <div className="w-full max-w-md relative z-10 mb-10">
        <div className="absolute inset-0 bg-green-500/10 blur-xl opacity-20" />
        <div className="relative bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-md">
           <p className={`text-lg font-medium tracking-wide transition-all ${step === 3 ? 'text-green-400' : 'text-gray-200'}`}>
             {instruction}
           </p>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {error && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className="bg-red-500/10 border border-red-500/50 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-3 text-red-400 font-bold text-sm">
                <AlertCircle size={18} /> {error}
            </div>
        </div>
      )}

      {/* Camera Viewfinder */}
      <div className="relative group">
        {/* Viewfinder Corners */}
        <div className="absolute -top-2 -left-2 w-10 h-10 border-t-2 border-l-2 border-white/20 rounded-tl-2xl" />
        <div className="absolute -top-2 -right-2 w-10 h-10 border-t-2 border-r-2 border-white/20 rounded-tr-2xl" />
        <div className="absolute -bottom-2 -left-2 w-10 h-10 border-b-2 border-l-2 border-white/20 rounded-bl-2xl" />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 border-b-2 border-r-2 border-white/20 rounded-br-2xl" />

        <div className="relative w-72 h-72 md:w-[450px] md:h-[450px]">
            {/* Pulsing Scanning Ring */}
            <div className={`absolute inset-0 rounded-full border border-white/5 transition-all duration-700 ${
                faceDetected ? 'scale-105 border-green-500/30' : 'scale-100'
            }`} />

            <div className="absolute inset-4 rounded-full overflow-hidden bg-zinc-900 shadow-[0_0_80px_rgba(0,0,0,0.8)] border-[6px] border-black ring-1 ring-white/10">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1] opacity-90 group-hover:opacity-100 transition-opacity"
                />
                
                {/* Visual Scanning Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-green-500/5 to-transparent h-1/2 w-full animate-scan" />

                {/* Success Screen Overlay */}
                {step === 3 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                        <div className="relative">
                            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-40 animate-pulse" />
                            <div className="relative bg-white rounded-full p-6 mb-6">
                                <UserCheck size={50} className="text-green-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 tracking-tighter">SUCCESSFUL</h3>
                        <div className="flex items-center gap-3 text-green-400/80 font-bold text-xs uppercase tracking-widest">
                            <Loader2 size={14} className="animate-spin" />
                            Redirecting to login...
                        </div>
                    </div>
                )}
            </div>

            {/* Status Badge */}
            {step === 2 && (
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full border backdrop-blur-xl shadow-2xl flex items-center gap-3 transition-all ${
                    faceDetected ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'
                }`}>
                    <RefreshCw size={14} className={`${faceDetected ? 'animate-spin' : ''}`} />
                    <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                        {faceDetected ? 'Biometric Sync' : 'Searching...'}
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Progress Cards */}
      <div className="mt-16 w-full max-w-xl z-10">
        <div className="grid grid-cols-3 gap-6 mb-10">
            {[
                { label: 'Neutral', key: 'center' },
                { label: 'Left Bias', key: 'left' },
                { label: 'Right Bias', key: 'right' }
            ].map((task) => (
                <div key={task.key} className={`relative group flex flex-col items-center p-5 rounded-3xl border transition-all duration-500 ${
                    detectionStats[task.key] 
                    ? 'bg-green-500/5 border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.1)]' 
                    : 'bg-white/5 border-white/5 text-gray-600'
                }`}>
                    {detectionStats[task.key] && (
                        <div className="absolute top-2 right-2 text-green-500">
                            <CheckCircle2 size={16} />
                        </div>
                    )}
                    <span className={`text-[10px] font-black uppercase tracking-widest ${detectionStats[task.key] ? 'text-green-400' : 'text-gray-500'}`}>
                        {task.label}
                    </span>
                </div>
            ))}
        </div>

        {/* Premium Progress Bar */}
        <div className="relative group">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Verification Status</span>
                <span className="text-2xl font-black text-white tabular-nums">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full p-1 border border-white/10 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-green-700 via-emerald-400 to-green-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                        width: `${verificationProgress}%`,
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                    }}
                />
            </div>
        </div>
      </div>

      {/* CSS For Scanning Animation */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FaceScan;