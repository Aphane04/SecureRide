import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [status, setStatus] = useState("Loading facial recognition models...");
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);
  const [headPosition, setHeadPosition] = useState("center");
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [faceapi, setFaceapi] = useState(null);

  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const positionHistoryRef = useRef([]);

  const steps = ["Loading Models", "Position Face", "Verify Movement", "Complete"];

  // Memoize initializeCamera to fix dependency warning
  const initializeCamera = useCallback(async () => {
    try {
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
        videoRef.current.onloadedmetadata = () => {
          setStatus("Position your face in the circle");
          setStep(2);
          startFaceDetection();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please enable camera permissions and refresh.');
    }
  }, []);

  // Load face-api library from CDN and load models
  useEffect(() => {
    const loadFaceAPI = async () => {
      try {
        // Wait for face-api to load from CDN (global window.faceapi)
        let attempts = 0;
        while (!window.faceapi && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }

        if (!window.faceapi) {
          throw new Error('face-api.js failed to load from CDN');
        }

        setFaceapi(window.faceapi);

        // Load the 4 pre-trained models from public/models directory
        const MODEL_URL = '/models';
        
        console.log('📦 Loading 4 face detection models...');
        
        await Promise.all([
          // Model 1 & 2: Tiny Face Detector + weights
          window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          // Model 3 & 4: Face Landmarks (68 points) + weights
          window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        console.log('✓ All 4 models loaded successfully:');
        console.log('  1. tiny_face_detector_model.bin');
        console.log('  2. tiny_face_detector_model-weights_manifest.json');
        console.log('  3. face_landmark_68_model.bin');
        console.log('  4. face_landmark_68_model-weights_manifest.json');
        
        setStatus("Models loaded. Enable camera access.");
        setStep(1);
        initializeCamera();
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        setError('Failed to load facial recognition models. Please refresh and try again.');
      }
    };

    loadFaceAPI();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [initializeCamera]);

  const startFaceDetection = () => {
    if (!videoRef.current || !faceapi || !canvasRef.current) return;

    detectionIntervalRef.current = setInterval(async () => {
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        // Use window.faceapi for detection + landmarks
        const detections = await window.faceapi
          .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (detections) {
          setFaceDetected(true);
          
          const landmarks = detections.landmarks;
          const box = detections.detection.box;
          
          // Extract landmarks from the 68-point model
          const nose = landmarks.getNose();
          const jaw = landmarks.getJawOutline();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();

          // Calculate head turn angle
          const eyeDistance = rightEye[0].x - leftEye[0].x;
          const noseX = nose[0].x;
          const noseToLeftEye = noseX - leftEye[0].x;
          const noseToRightEye = rightEye[0].x - noseX;

          let currentPosition = 'center';
          const ratio = noseToLeftEye / eyeDistance;

          if (ratio < 0.3) {
            currentPosition = 'right';
          } else if (ratio > 0.7) {
            currentPosition = 'left';
          } else {
            currentPosition = 'center';
          }

          setHeadPosition(currentPosition);

          positionHistoryRef.current.push(currentPosition);
          if (positionHistoryRef.current.length > 50) {
            positionHistoryRef.current.shift();
          }

          const hasLeftTurn = positionHistoryRef.current.includes('left');
          const hasRightTurn = positionHistoryRef.current.includes('right');
          const hasCenterPosition = positionHistoryRef.current.includes('center');

          let progress = 0;
          if (hasCenterPosition) progress += 33;
          if (hasLeftTurn) progress += 33;
          if (hasRightTurn) progress += 34;

          setVerificationProgress(progress);
          setStatus(`Face detected! Move your head: ${progress}% verified`);

          if (hasLeftTurn && hasRightTurn && hasCenterPosition) {
            completeVerification();
          }
        } else {
          setFaceDetected(false);
          setVerificationProgress(0);
          positionHistoryRef.current = [];
          setStatus("Position your face clearly in the circle");
          setHeadPosition('none');
        }
      } catch (err) {
        console.error('Face detection error:', err);
      }
    }, 300);
  };

  const completeVerification = async () => {
    try {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }

      setStep(3);
      setStatus("Verification Complete! ✓");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (userId) {
        await authAPI.verifyLiveness(userId);
      }

      setTimeout(() => {
        navigate('/dashboard/passenger');
      }, 2000);
    } catch (err) {
      console.error('Verification completion error:', err);
      setError('Verification failed. Please try again.');
      setStep(2);
      setVerificationProgress(0);
      positionHistoryRef.current = [];
      
      startFaceDetection();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tighter mb-2">Live Identity Verification</h2>
        <p className="text-gray-500 text-sm italic uppercase tracking-widest">Ensure liveness by moving your head</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm max-w-md text-center flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480} />

      <div className="relative w-80 h-80 lg:w-[450px] lg:h-[450px] mb-8">
        <div
          className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-700 ${
            step === 3
              ? 'border-[#008751] animate-none'
              : faceDetected
              ? 'border-green-500 animate-pulse'
              : 'border-gray-800 animate-spin-slow'
          }`}
        ></div>

        <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_50px_rgba(0,135,81,0.2)]">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {step >= 2 && faceDetected && (
          <div className="absolute inset-4 rounded-full border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse"></div>
        )}

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] px-6 py-2 rounded-full border border-gray-800 shadow-2xl flex items-center gap-2">
          {step === 3 ? (
            <UserCheck className="text-[#008751]" size={18} />
          ) : (
            <RefreshCw
              className={`${faceDetected ? 'animate-spin text-green-500' : 'text-gray-500'}`}
              size={18}
            />
          )}
          <span
            className={`font-bold text-sm ${
              step === 3 ? 'text-[#008751]' : faceDetected ? 'text-green-400' : 'text-white'
            }`}
          >
            {faceDetected ? 'Face Detected' : 'Waiting...'}
          </span>
        </div>
      </div>

      {step >= 2 && faceDetected && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-2">Current Head Position:</p>
          <div className="flex gap-4 justify-center">
            <div
              className={`px-4 py-2 rounded-lg border transition-all ${
                headPosition === 'left'
                  ? 'bg-[#008751] border-[#008751] text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              ← LEFT
            </div>
            <div
              className={`px-4 py-2 rounded-lg border transition-all ${
                headPosition === 'center'
                  ? 'bg-[#008751] border-[#008751] text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              → CENTER
            </div>
            <div
              className={`px-4 py-2 rounded-lg border transition-all ${
                headPosition === 'right'
                  ? 'bg-[#008751] border-[#008751] text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              RIGHT ←
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 grid grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                step > i ? 'bg-[#008751]' : 'bg-gray-800'
              }`}
            ></div>
            <p
              className={`text-[9px] font-bold uppercase tracking-widest ${
                step > i ? 'text-white' : 'text-gray-700'
              }`}
            >
              {s}
            </p>
          </div>
        ))}
      </div>

      {step === 2 && (
        <div className="mt-10 w-72 bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#008751] to-green-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,135,81,0.5)]"
            style={{ width: `${verificationProgress}%` }}
          ></div>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-400 text-center max-w-md">{status}</p>

      {step === 2 && (
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Required Head Movements:</p>
          <div className="flex gap-3 justify-center text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${positionHistoryRef.current?.includes('center') ? 'bg-[#008751]' : 'bg-gray-600'}`}></div>
              Look Straight
            </div>
            <div className="text-gray-600">•</div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${positionHistoryRef.current?.includes('left') ? 'bg-[#008751]' : 'bg-gray-600'}`}></div>
              Turn Left
            </div>
            <div className="text-gray-600">•</div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${positionHistoryRef.current?.includes('right') ? 'bg-[#008751]' : 'bg-gray-600'}`}></div>
              Turn Right
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceScan;