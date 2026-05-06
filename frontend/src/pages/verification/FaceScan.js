import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { authAPI } from '../../utils/api';

const FaceScan = () => {
  const videoRef = useRef(null);
  const intervalRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  const [status, setStatus] = useState("Loading models...");
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [faceDetected, setFaceDetected] = useState(false);

  const steps = ["Look Straight", "Turn Left", "Turn Right", "Complete"];

  // ✅ Load models + start camera
  useEffect(() => {
    const init = async () => {
      try {
        const MODEL_URL = '/models';

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        console.log('✅ Models loaded');

        setStatus("Starting camera...");
        startVideo();
      } catch (err) {
        console.error(err);
        setError("Failed to load face models");
      }
    };

    init();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // ✅ Start camera
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          videoRef.current.play();
          setStatus(steps[0]);
          startDetection();
        };
      }
    } catch (err) {
      console.error(err);
      setError("Camera access denied. Please allow camera.");
    }
  };

  // ✅ Face detection loop
  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      try {
        if (!videoRef.current) return;

        const detection = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks();

        if (!detection) {
          setFaceDetected(false);
          return;
        }

        setFaceDetected(true);

        const nose = detection.landmarks.getNose();
        const jaw = detection.landmarks.getJawOutline();

        const noseX = nose[0].x;
        const jawWidth = jaw[16].x - jaw[0].x;
        const relativePos = (noseX - jaw[0].x) / jawWidth;

        setStep(prev => {
          if (prev === 0 && relativePos > 0.4 && relativePos < 0.6) {
            setStatus(steps[1]);
            return 1;
          }
          if (prev === 1 && relativePos < 0.35) {
            setStatus(steps[2]);
            return 2;
          }
          if (prev === 2 && relativePos > 0.65) {
            completeVerification();
            return 3;
          }
          return prev;
        });

      } catch (err) {
        console.error('Detection error:', err);
        setError("Face detection failed");
      }
    }, 500);
  };

  // ✅ Complete verification
  const completeVerification = async () => {
    clearInterval(intervalRef.current);
    setStatus("Verification Successful");

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }

    try {
      if (userId) {
        await authAPI.verifyLiveness(userId);
      }
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      navigate('/dashboard/passenger');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-6">

      <h2 className="text-2xl font-bold mb-6">Face Verification</h2>

      {error && (
        <div className="mb-4 text-red-400 flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-gray-800">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-full h-full object-cover"
        />
      </div>

      <div className="mt-6 flex items-center gap-2">
        {step === 3 ? (
          <UserCheck className="text-green-500" />
        ) : (
          <RefreshCw className="animate-spin" />
        )}
        <span>{status}</span>
      </div>

      <div className="mt-10 flex gap-4">
        {steps.map((s, i) => (
          <div key={i} className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto ${step >= i ? 'bg-green-500' : 'bg-gray-700'}`}></div>
            <p className="text-xs mt-1">{s}</p>
          </div>
        ))}
      </div>

      {!faceDetected && (
        <p className="mt-4 text-gray-400 text-sm">
          Make sure your face is clearly visible
        </p>
      )}
    </div>
  );
};

export default FaceScan;