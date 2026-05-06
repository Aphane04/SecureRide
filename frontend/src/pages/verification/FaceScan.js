import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [status, setStatus] = useState("Initializing system...");
  const [step, setStep] = useState(0); // 0: Init, 1: Camera Ready, 2: Detecting, 3: Success
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [headPosition, setHeadPosition] = useState("none");
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [detectionStats, setDetectionStats] = useState({
    center: false,
    left: false,
    right: false
  });

  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const positionHistoryRef = useRef([]);

  const steps = ["Models", "Camera", "Scanning", "Done"];

  // Clean up function to stop camera and intervals
  const cleanup = useCallback(() => {
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      setStatus("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Important: Wait for video to actually start playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStep(2);
          setStatus("Position your face in the circle");
          startFaceDetection();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions and refresh.');
    }
  }, []);

  useEffect(() => {
    const loadModelsAndStart = async () => {
      try {
        // 1. Wait for window.faceapi to be available (max 10 seconds)
        let checks = 0;
        while (!window.faceapi && checks < 50) {
          await new Promise(r => setTimeout(r, 200));
          checks++;
        }

        if (!window.faceapi) {
          throw new Error("Facial recognition library failed to load from CDN.");
        }

        setStatus("Loading AI models...");
        
        // 2. Load models from /public/models
        // Note: Ensure filenames in /public/models match exactly what face-api expects
        await Promise.all([
          window.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          window.faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        ]);

        setStep(1);
        initializeCamera();
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err.message || "Failed to load models.");
      }
    };

    loadModelsAndStart();
    return () => cleanup();
  }, [initializeCamera, cleanup]);

  const startFaceDetection = () => {
    if (!videoRef.current || !window.faceapi) return;

    detectionIntervalRef.current = setInterval(async () => {
      try {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detection) {
          setFaceDetected(true);
          const landmarks = detection.landmarks;
          const nose = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          // Calculate movement
          const eyeDist = rightEye[0].x - leftEye[0].x;
          const noseRelX = (nose[0].x - leftEye[0].x) / eyeDist;

          let currentPos = 'center';
          if (noseRelX < 0.3) currentPos = 'right';
          else if (noseRelX > 0.7) currentPos = 'left';

          setHeadPosition(currentPos);
          
          // Logic for tracking progress
          positionHistoryRef.current.push(currentPos);
          
          const hasLeft = positionHistoryRef.current.includes('left');
          const hasRight = positionHistoryRef.current.includes('right');
          const hasCenter = positionHistoryRef.current.includes('center');

          setDetectionStats({ center: hasCenter, left: hasLeft, right: hasRight });

          const progress = [hasLeft, hasRight, hasCenter].filter(Boolean).length * 33.3;
          setVerificationProgress(progress);

          if (hasLeft && hasRight && hasCenter) {
            handleComplete();
          }
        } else {
          setFaceDetected(false);
          setHeadPosition('none');
        }
      } catch (err) {
        console.error("Detection loop error:", err);
      }
    }, 200);
  };

  const handleComplete = async () => {
    clearInterval(detectionIntervalRef.current);
    setStep(3);
    setStatus("Identity Verified!");
    
    try {
      if (userId) {
        await authAPI.verifyLiveness(userId);
      }
      setTimeout(() => navigate('/dashboard/passenger'), 1500);
    } catch (err) {
      setError("Server verification failed. Try again.");
      setStep(2); // Reset to scanning
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black tracking-tight mb-2">Liveness Check</h2>
        <p className="text-gray-500 text-xs uppercase tracking-widest">{status}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 text-sm flex items-center gap-3 max-w-md">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="relative w-72 h-72 md:w-96 md:h-96">
        {/* Outer Ring */}
        <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-1000 ${
          faceDetected ? 'border-green-500 rotate-180' : 'border-gray-800'
        }`} style={{ transitionDuration: '10s' }} />

        {/* Video Container */}
        <div className="absolute inset-3 rounded-full overflow-hidden bg-gray-900 border-4 border-[#121212]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {!faceDetected && step === 2 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <p className="text-white text-sm font-bold animate-pulse">Position Face Inside</p>
            </div>
          )}
        </div>

        {/* Success Overlay */}
        {step === 3 && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-600/20 rounded-full backdrop-blur-md">
             <UserCheck size={80} className="text-green-500" />
          </div>
        )}
      </div>

      {/* Progress & Controls */}
      <div className="mt-10 w-full max-w-xs">
        <div className="flex justify-between mb-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Verification Progress</span>
          <span className="text-[10px] text-green-500 font-bold">{Math.round(verificationProgress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-500" 
            style={{ width: `${verificationProgress}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-6">
          {['Left', 'Center', 'Right'].map((pos) => (
            <div key={pos} className="flex flex-col items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${detectionStats[pos.toLowerCase()] ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-gray-800'}`} />
              <span className="text-[10px] text-gray-500 uppercase">{pos}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FaceScan;