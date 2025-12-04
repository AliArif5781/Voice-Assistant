import { useState, useCallback, useRef, useEffect } from "react";

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = typeof window !== "undefined" && 
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

  const clearRestartTimeout = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      
      // Handle specific errors
      if (event.error === "network") {
        setError("Network error - speech recognition requires internet connection. Try typing instead.");
      } else if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        // Restart on no-speech if still listening
        return;
      } else {
        setError(`Speech error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // Only set listening to false if we're not trying to continue
      setIsListening(false);
      setInterimTranscript("");
    };

    return () => {
      clearRestartTimeout();
      if (recognition) {
        recognition.abort();
      }
    };
  }, [isSupported, clearRestartTimeout]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError("Speech recognition is not supported in this browser. Try typing instead.");
      return;
    }

    setError(null);
    setTranscript("");
    setInterimTranscript("");
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      if (err.message?.includes("already started")) {
        // Already started, that's fine
        setIsListening(true);
      } else {
        setError("Failed to start speech recognition. Try typing instead.");
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    clearRestartTimeout();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Ignore errors when stopping
      }
      setIsListening(false);
    }
  }, [clearRestartTimeout]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
