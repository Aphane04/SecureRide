import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js/dist/face-api.min.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef();
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [status, setStatus] = useState("Initializing AI...");
  const [step, setStep] = useState(0); // 0: Straight, 1: Left, 2: Right, 3: Success
  const [error, setError] = useState('');

  // Store interval ID in a ref so it can be cleared on unmount or completion
  const intervalRef = useRef(null);

  const steps = ["Look Straight", "Turn Head Left", "Turn Head Right"];

  const startVideo = useCallback(() => {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        setStatus(steps[0]);
      })
      .catch((err) => {
        console.error(err);
        setError('Camera access denied. Please allow camera access and refresh.');
      });
  }, [steps]);

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

    return () => {
      // Clear detection interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Stop camera stream on unmount
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startVideo]);

  const handleVideoPlay = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (detections) {
        const landmarks = detections.landmarks;
        const nose = landmarks.getNose();
        const jaw = landmarks.getJawOutline();

        // Liveness logic: relative nose position within jaw width
        const noseX = nose[0].x;
        const jawWidth = jaw[16].x - jaw[0].x;
        const relativePos = (noseX - jaw[0].x) / jawWidth;

        setStep((prev) => {
          if (prev === 0 && relativePos > 0.4 && relativePos < 0.6) {
            setStatus(steps[1]);
            return 1;
          } else if (prev === 1 && relativePos < 0.3) {
            setStatus(steps[2]);
            return 2;
          } else if (prev === 2 && relativePos > 0.7) {
            setStatus("Verification Successful");
            clearInterval(intervalRef.current);
            // Stop camera stream
            if (videoRef.current?.srcObject) {
              videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
            }
            completeVerification();
            return 3;
          }
          return prev;
        });
      }
    }, 500);
  };

  const completeVerification = async () => {
    try {
      if (userId) {
        await authAPI.verifyLiveness(userId);
      }
    } catch (err) {
      console.error('Liveness API call failed:', err);
    } finally {
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black tracking-tighter mb-2">Live Identity Verification</h2>
        <p className="text-gray-500 text-sm italic uppercase tracking-widest">Ensuring you are a real person</p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded text-red-400 text-sm max-w-sm text-center">
          {error}
        </div>
      )}

      <div className="relative w-80 h-80 lg:w-[450px] lg:h-[450px]">
        <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all duration-700 ${step === 3 ? 'border-[#008751] animate-none' : 'border-gray-800 animate-spin-slow'}`}></div>

        <div className="absolute inset-4 rounded-full overflow-hidden border-2 border-white/10 shadow-[0_0_50px_rgba(0,135,81,0.2)]">
          <video
            ref={videoRef}
            onPlay={handleVideoPlay}
            autoPlay
            muted
            className="w-full h-full object-cover grayscale brightness-110"
          />
        </div>

        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#121212] px-8 py-3 rounded-full border border-gray-800 shadow-2xl flex items-center gap-3">
          {step === 3
            ? <UserCheck className="text-[#008751]" />
            : <RefreshCw className="animate-spin text-gray-500" size={18} />
          }
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