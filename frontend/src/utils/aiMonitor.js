import { useEffect, useState, useRef } from 'react';
import { tripAPI } from './api';

// Broadened list to catch natural speech variations
const DANGER_WORDS = [
  "help", "stop the car", "stop", "don't touch me", "dont touch", 
  "police", "no no", "where are you taking me", "let me out", 
  "get off", "get away", "danger", "emergency"
];

export const useAiMonitor = (activeTripId) => {
  const [dangerDetected, setDangerDetected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Only monitor if there is an active trip
    if (!activeTripId) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("AI MONITOR: This browser does not support Speech Recognition.");
      return;
    }

    const startRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false; // Only final processed text
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log("🛡️ AI Monitor: Security Ear Active...");
      };

      recognition.onresult = async (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.toLowerCase();
        const confidence = event.results[lastResultIndex][0].confidence;

        // Check for danger words if AI is at least 50% sure of what it heard
        if (confidence > 0.5) {
          const containsDanger = DANGER_WORDS.some(word => transcript.includes(word));

          if (containsDanger) {
            setDangerDetected(true);
            console.warn(`🚨 AI ALERT: "${transcript}" (Confidence: ${Math.round(confidence * 100)}%)`);
            
            // Trigger Backend Emergency Protocol
            try {
              await tripAPI.triggerAlert(activeTripId, transcript);
            } catch (error) {
              console.error("Alert delivery failed:", error);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.error("AI MONITOR ERROR:", event.error);
        if (event.error === 'not-allowed') {
          alert("Safety Monitor: Please allow microphone access for trip security.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Safety Restart: If the trip is still active, start listening again after a short pause
        if (activeTripId && !dangerDetected) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log("Recognition already running.");
            }
          }, 1000);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    };

    startRecognition();

    // Cleanup when trip ends or component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [activeTripId, dangerDetected]);

  return { dangerDetected, isListening };
};