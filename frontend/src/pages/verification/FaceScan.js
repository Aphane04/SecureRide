import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [status, setStatus] = useState("Initializing system...");
  const [instruction, setInstruction] = useState("Wait a moment...");
  const [step, setStep] = useState(0); // 0: Init, 1: Camera Ready, 2: Detecting, 3: Success
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
  const positionHistoryRef = useRef([]);

  const cleanup = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      setStatus("Camera Access");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStep(2);
          setInstruction("Position your face in the circle");
          startFaceDetection();
        };
      }
    } catch (err) {
      setError('Camera access denied. Please enable permissions.');
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
        setError("Failed to load AI models.");
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
          if (noseRelX < 0.35) currentPos = 'right';
          else if (noseRelX > 0.65) currentPos = 'left';

          // Track unique movements
          if (!detectionStats.center && currentPos === 'center') {
             setDetectionStats(prev => ({ ...prev, center: true }));
          } else if (detectionStats.center && !detectionStats.left && currentPos === 'left') {
             setDetectionStats(prev => ({ ...prev, left: true }));
          } else if (detectionStats.left && !detectionStats.right && currentPos === 'right') {
             setDetectionStats(prev => ({ ...prev, right: true }));
          }

          // Update Instructions based on missing steps
          if (!detectionStats.center) {
            setInstruction("Look straight at the camera");
          } else if (!detectionStats.left) {
            setInstruction("Slowly turn your head to the LEFT ←");
          } else if (!detectionStats.right) {
            setInstruction("Now slowly turn your head to the RIGHT →");
          }

          const progress = (Object.values(detectionStats).filter(Boolean).length / 3) * 100;
          setVerificationProgress(progress);

          if (detectionStats.center && detectionStats.left && detectionStats.right) {
            handleComplete();
          }
        } else {
          setFaceDetected(false);
          setInstruction("Face not detected. Move into the light.");
        }
      } catch (err) {
        console.error(err);
      }
    }, 200);
  };

  const handleComplete = async () => {
    clearInterval(detectionIntervalRef.current);
    setStep(3);
    setInstruction("Verification Successful");
    
    try {
      if (userId) await authAPI.verifyLiveness(userId);
      // Brief pause to show the success message
      setTimeout(() => navigate('/dashboard/passenger'), 3000);
    } catch (err) {
      setError("Verification failed on server.");
      setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      
      {/* Top Header */}
      <div className="mb-10 text-center z-10">
        <h2 className="text-3xl font-black tracking-tighter mb-2">Security Check</h2>
        <div className="flex items-center justify-center gap-2 text-[#008751] font-bold text-xs uppercase tracking-[0.2em]">
            <CheckCircle2 size={14} /> AI-Powered Liveness Detection
        </div>
      </div>

      {/* Instruction Banner */}
      <div className={`mb-8 px-8 py-4 rounded-2xl border transition-all duration-500 ${
        step === 3 ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10'
      }`}>
        <p className={`text-lg font-bold text-center ${step === 3 ? 'text-green-400' : 'text-white'}`}>
          {instruction}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-3 animate-bounce">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Main Camera Area */}
      <div className="relative w-80 h-80 md:w-[420px] md:h-[420px]">
        {/* Animated Scanning Ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000 ${
          step === 3 ? 'border-green-500 border-solid scale-105' : faceDetected ? 'border-green-500/50 animate-spin-slow' : 'border-gray-800'
        }`} />

        <div className="absolute inset-4 rounded-full overflow-hidden bg-gray-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#1a1a1a]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          
          {/* Step 3 Success Screen */}
          {step === 3 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/90 backdrop-blur-md transition-all animate-in fade-in duration-500">
               <div className="bg-white rounded-full p-4 mb-4 shadow-2xl">
                 <UserCheck size={50} className="text-green-600" />
               </div>
               <h3 className="text-2xl font-black text-white mb-1">VERIFIED</h3>
               <p className="text-white/80 text-xs font-bold uppercase tracking-widest animate-pulse">
                 Redirecting to Dashboard...
               </p>
            </div>
          )}
        </div>

        {/* Floating Indicator */}
        {step === 2 && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-[#121212] border border-gray-800 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl">
                <RefreshCw size={14} className={`${faceDetected ? 'animate-spin text-green-500' : 'text-gray-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {faceDetected ? 'Face Synced' : 'Searching...'}
                </span>
            </div>
        )}
      </div>

      {/* Task Checklist */}
      <div className="mt-16 w-full max-w-sm">
        <div className="grid grid-cols-3 gap-4">
            {[
                { label: 'Straight', key: 'center' },
                { label: 'Turn Left', key: 'left' },
                { label: 'Turn Right', key: 'right' }
            ].map((task) => (
                <div key={task.key} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                    detectionStats[task.key] ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-white/5 border-white/5 text-gray-600'
                }`}>
                    <CheckCircle2 size={20} className="mb-2" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">{task.label}</span>
                </div>
            ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Completion</span>
                <span className="text-xl font-black text-white">{Math.round(verificationProgress)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-900 rounded-full border border-white/5 overflow-hidden">
                <div 
                    className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-700 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    style={{ width: `${verificationProgress}%` }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default FaceScan;