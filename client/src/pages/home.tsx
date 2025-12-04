import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

import heroBg from "@assets/generated_images/abstract_neon_sound_wave_visualization.png";

export default function Home() {
  const [savedTranscripts, setSavedTranscripts] = useState<string[]>([]);

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const currentText = transcript + interimTranscript;

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        setSavedTranscripts(prev => [transcript.trim(), ...prev]);
      }
      resetTranscript();
    } else {
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background z-10" />
        <img 
          src={heroBg} 
          alt="Background" 
          className="w-full h-full object-cover opacity-30"
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Voice to Text
            </h1>
            <p className="text-lg text-muted-foreground">
              Click the microphone and start speaking
            </p>
          </div>

          {/* Voice Input Card */}
          <Card className="bg-card/80 backdrop-blur-md border-border/50 mb-8">
            <CardContent className="p-8">
              {/* Microphone Button */}
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  onClick={toggleListening}
                  disabled={!isSpeechSupported}
                  data-testid="button-mic-toggle"
                  className={`h-24 w-24 rounded-full p-0 transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse' 
                      : 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-primary-foreground" />
                  )}
                </Button>

                <p className="mt-4 text-sm text-muted-foreground">
                  {isListening ? "Listening... Click to stop" : "Click to start speaking"}
                </p>
              </div>

              {/* Current Speech Display */}
              <div className="mt-8 min-h-[120px] p-6 bg-background/50 rounded-xl border border-border/30">
                <div className="flex items-start gap-3">
                  <Volume2 className={`w-5 h-5 mt-1 flex-shrink-0 ${isListening ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    {currentText ? (
                      <p className="text-lg text-foreground leading-relaxed" data-testid="text-current-speech">
                        {currentText}
                        {isListening && <span className="animate-pulse text-primary">|</span>}
                      </p>
                    ) : (
                      <p className="text-lg text-muted-foreground italic" data-testid="text-placeholder">
                        {isListening ? "Start speaking..." : "Your speech will appear here"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {speechError && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive" data-testid="text-error">
                    {speechError}
                  </p>
                </div>
              )}

              {/* Browser Support Warning */}
              {!isSpeechSupported && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Speech recognition is not supported in this browser. Please try Chrome or Edge.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Transcripts */}
          {savedTranscripts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-foreground">Previous Recordings</h2>
              <div className="space-y-3">
                {savedTranscripts.map((text, index) => (
                  <Card key={index} className="bg-card/60 backdrop-blur-sm border-border/30" data-testid={`card-transcript-${index}`}>
                    <CardContent className="p-4">
                      <p className="text-foreground" data-testid={`text-saved-transcript-${index}`}>
                        "{text}"
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
