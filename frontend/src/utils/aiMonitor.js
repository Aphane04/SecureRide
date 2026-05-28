import { useEffect, useState, useRef } from 'react';
import { tripAPI } from './api';

const DANGER_WORDS = [
  "help", "stop the car", "stop", "don't touch me", "dont touch", 
  "police", "no no", "where are you taking me", "let me out", 
  "get off", "get away", "danger", "emergency", "help me"
];

export const useAiMonitor = (activeTripId) => {
  const [dangerDetected, setDangerDetected] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const recognitionRef = useRef(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    
    // Only monitor if there is an active trip and no danger has been found yet
    if (!activeTripId || dangerDetected) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("❌ AI MONITOR: This browser does not support Speech Recognition.");
      return;
    }

    const startRecognition = () => {
      // 1. Clean up existing instance
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      // 2. Create new instance
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Set to true for faster detection
      recognition.lang = 'en-ZA'; // Set to South Africa English for better local accuracy
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsMicrophoneActive(true);
        console.log("🛡️ AI Monitor: Security Terminal listening...");
      };

      recognition.onresult = async (event) => {
        // Loop through the results (catches both interim and final speech)
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript.toLowerCase();
          const confidence = event.results[i][0].confidence;

          // DEBUG: See exactly what the AI thinks you are saying
          console.log(`🎤 AI Heard: "${transcript}" (Confidence: ${Math.round(confidence * 100)}%)`);

          // Only trigger if AI is somewhat confident
          if (confidence > 0.3) {
            const containsDanger = DANGER_WORDS.some(word => transcript.includes(word));

            if (containsDanger) {
              setDangerDetected(true);
              console.warn(`🚨 DANGER DETECTED: Triggering emergency protocols...`);
              
              // Call the backend
              try {
                await tripAPI.triggerAlert(activeTripId, transcript);
                // Stop the microphone once danger is found to prevent duplicate alerts
                recognition.stop();
              } catch (error) {
                console.error("Alert delivery failed:", error);
              }
            }
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          console.error("❌ AI MONITOR: Microphone access denied.");
        } else if (event.error !== 'aborted') {
          console.error("⚠️ AI MONITOR ERROR:", event.error);
        }
      };

      recognition.onend = () => {
        setIsMicrophoneActive(false);
        // RESTART LOGIC: If trip is still active, restart after 1 second
        if (isComponentMounted.current && !dangerDetected && activeTripId) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // Silently fail if already started
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
      
      try {
        recognition.start();
      } catch (e) {
        console.log("Recognition busy.");
      }
    };

    startRecognition();

    return () => {
      isComponentMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeTripId, dangerDetected]);

  return { dangerDetected, isMicrophoneActive };
};