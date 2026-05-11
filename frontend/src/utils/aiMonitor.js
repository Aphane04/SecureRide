import { useEffect, useState, useRef } from 'react';
import { tripAPI } from './api';

const DANGER_WORDS = [
  "help", "stop the car", "stop", "don't touch me", "dont touch", 
  "police", "no no", "where are you taking me", "let me out", 
  "get off", "get away", "danger", "emergency"
];

export const useAiMonitor = (activeTripId) => {
  const [dangerDetected, setDangerDetected] = useState(false);
  const recognitionRef = useRef(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    
    // Only start if we have a trip and haven't already hit an alert
    if (!activeTripId || dangerDetected) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("AI MONITOR: Browser not supported.");
      return;
    }

    const startRecognition = () => {
      // If an instance already exists, stop it before making a new one
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log("🛡️ AI Monitor: Security Ear Active...");
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        const confidence = event.results[event.results.length - 1][0].confidence;

        if (confidence > 0.4) {
          const containsDanger = DANGER_WORDS.some(word => transcript.includes(word));

          if (containsDanger) {
            setDangerDetected(true);
            console.warn(`🚨 AI ALERT: ${transcript}`);
            
            try {
              await tripAPI.triggerAlert(activeTripId, transcript);
            } catch (error) {
              console.error("Alert delivery failed:", error);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        // We ignore 'aborted' errors as they are caused by the system resetting
        if (event.error !== 'aborted') {
          console.error("AI MONITOR ERROR:", event.error);
        }
      };

      recognition.onend = () => {
        // Only restart if the component is still alive and no danger was found
        if (isComponentMounted.current && !dangerDetected && activeTripId) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              // Silently catch "already started" errors
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
      
      try {
        recognition.start();
      } catch (e) {
        console.log("Recognition start skipped: Already running.");
      }
    };

    startRecognition();

    return () => {
      isComponentMounted.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeTripId, dangerDetected]); // This now handles resets safely

  return { dangerDetected };
};