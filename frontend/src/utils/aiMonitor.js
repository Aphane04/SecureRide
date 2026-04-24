import { useEffect, useState } from 'react';
import { tripAPI } from './api';

const DANGER_WORDS = ["help", "stop", "don't touch me", "dont touch", "police", "no no", "where are you taking me"];

export const useAiMonitor = (activeTripId) => {
  const [dangerDetected, setDangerDetected] = useState(false);

  useEffect(() => {
    if (!activeTripId) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';

    recognition.onresult = async (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      
      const containsDanger = DANGER_WORDS.some(word => transcript.includes(word));

      if (containsDanger) {
        setDangerDetected(true);
        console.warn("AI MONITOR: Danger word detected. Alerting Admin...");
        
        // This hits the FastAPI endpoint we wrote in main.py
        try {
          await tripAPI.triggerAlert(activeTripId, transcript);
        } catch (error) {
          console.error("Alert delivery failed:", error);
        }
      }
    };

    recognition.onend = () => {
      if (activeTripId) recognition.start(); // Keep listening during the trip
    };

    recognition.start();

    return () => recognition.stop();
  }, [activeTripId]);

  return { dangerDetected };
};