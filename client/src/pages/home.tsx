import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Loader2, Sparkles, Waves, AudioWaveform } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

import heroBg from "@assets/generated_images/futuristic_tech_sound_wave_background.png";
import orbImage from "@assets/generated_images/ai_voice_assistant_glowing_orb.png";

function FloatingParticles() {
  const [particles] = useState(() => {
    return [...Array(10)].map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 4 + 5,
      delay: Math.random() * 3,
      drift: Math.random() * -120 - 40,
    }));
  });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [0, p.drift],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function VoiceWaveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-primary to-accent"
          animate={{
            height: isActive ? [8, Math.random() * 32 + 16, 8] : 8,
          }}
          transition={{
            duration: 0.4,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const [savedTranscripts, setSavedTranscripts] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    isRecording,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsProcessing(true);
      setError(null);
      setCurrentTranscript("");
      
      try {
        const audioBlob = await stopRecording();
        
        if (audioBlob && audioBlob.size > 0) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              
              const response = await fetch('/api/transcribe', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  audio: base64Audio,
                  mimeType: audioBlob.type
                }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to transcribe audio');
              }

              const data = await response.json();
              const transcript = data.transcript?.trim() || "";
              
              if (transcript && transcript !== "No speech detected.") {
                setCurrentTranscript(transcript);
                setSavedTranscripts(prev => [transcript, ...prev]);
              } else {
                setCurrentTranscript("No speech detected. Try speaking louder or closer to the microphone.");
              }
            } catch (err: any) {
              console.error('Transcription error:', err);
              setError(err.message || 'Failed to transcribe audio');
            } finally {
              setIsProcessing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        } else {
          setCurrentTranscript("No audio recorded. Please try again.");
          setIsProcessing(false);
        }
      } catch (err: any) {
        console.error('Recording error:', err);
        setError(err.message || 'Failed to process recording');
        setIsProcessing(false);
      }
      
      resetRecording();
    } else {
      setError(null);
      setCurrentTranscript("");
      await startRecording();
    }
  };

  const displayError = error || recordingError;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Background Layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-10" />
        <img 
          src={heroBg} 
          alt="" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      <FloatingParticles />

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Powered by Gemini AI</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6">
              <span className="text-gradient-vibrant">Voice</span>
              <span className="text-foreground"> to </span>
              <span className="text-gradient">Text</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
              Transform your voice into text instantly with advanced AI. 
              Simply speak, and watch your words come to life.
            </p>
          </motion.div>

          {/* Main Voice Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card glow-effect overflow-visible mb-8 sm:mb-10">
              <CardContent className="p-6 sm:p-8 md:p-10">
                {/* Voice Orb and Button Section */}
                <div className="flex flex-col items-center">
                  {/* Floating Orb Visual */}
                  <motion.div
                    className="relative mb-6 sm:mb-8"
                    animate={{ y: isRecording ? [-5, 5, -5] : 0 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                      <motion.div
                        className={`absolute inset-0 rounded-full ${
                          isRecording 
                            ? 'bg-red-500/20' 
                            : isProcessing 
                              ? 'bg-yellow-500/20' 
                              : 'bg-primary/20'
                        }`}
                        animate={{ scale: isRecording ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <img 
                        src={orbImage} 
                        alt="" 
                        className={`w-full h-full object-contain relative z-10 ${
                          isRecording ? 'animate-pulse' : ''
                        }`}
                      />
                    </div>
                  </motion.div>

                  {/* Voice Waveform */}
                  <div className="mb-6">
                    <VoiceWaveform isActive={isRecording} />
                  </div>

                  {/* Microphone Button */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      onClick={handleToggleRecording}
                      disabled={isProcessing}
                      data-testid="button-mic-toggle"
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
                        isRecording 
                          ? 'bg-gradient-to-br from-red-500 to-red-600 glow-recording' 
                          : isProcessing
                            ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                            : 'bg-gradient-to-br from-primary to-cyan-500 glow-effect'
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="w-8 h-8 text-white" />
                      ) : isProcessing ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Mic className="w-8 h-8 text-white" />
                      )}
                    </button>
                  </motion.div>

                  <p className="mt-4 text-sm sm:text-base text-muted-foreground text-center">
                    {isRecording 
                      ? "Recording... Tap to stop" 
                      : isProcessing 
                        ? "Processing your speech..." 
                        : "Tap to start recording"}
                  </p>
                </div>

                {/* Transcript Display */}
                <motion.div 
                  className="mt-8 sm:mt-10"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  <div className="min-h-[100px] sm:min-h-[120px] p-4 sm:p-6 bg-background/50 rounded-xl border border-border/30 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isRecording 
                          ? 'bg-red-500/20 text-red-400' 
                          : isProcessing 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-primary/20 text-primary'
                      }`}>
                        {isRecording ? (
                          <AudioWaveform className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <AnimatePresence mode="wait">
                          {isRecording ? (
                            <motion.p
                              key="recording"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-base sm:text-lg text-foreground leading-relaxed"
                              data-testid="text-recording-status"
                            >
                              Listening to you speak...
                              <span className="text-red-400 ml-2">[Recording]</span>
                            </motion.p>
                          ) : isProcessing ? (
                            <motion.div
                              key="processing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 text-base sm:text-lg text-yellow-400"
                              data-testid="text-processing-status"
                            >
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Transcribing your audio...
                            </motion.div>
                          ) : currentTranscript ? (
                            <motion.p
                              key="transcript"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-base sm:text-lg text-foreground leading-relaxed break-words"
                              data-testid="text-current-speech"
                            >
                              {currentTranscript}
                            </motion.p>
                          ) : (
                            <motion.p
                              key="placeholder"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-base sm:text-lg text-muted-foreground italic"
                              data-testid="text-placeholder"
                            >
                              Your transcribed text will appear here...
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  <AnimatePresence>
                    {displayError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
                      >
                        <p className="text-sm text-destructive" data-testid="text-error">
                          {displayError}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Saved Transcripts */}
          <AnimatePresence>
            {savedTranscripts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <Waves className="w-5 h-5 text-primary" />
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                    Previous Recordings
                  </h2>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                    {savedTranscripts.length}
                  </span>
                </div>
                
                <div className="grid gap-3 sm:gap-4">
                  {savedTranscripts.map((text, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card 
                        className="glass-panel hover:border-primary/30 transition-colors" 
                        data-testid={`card-transcript-${index}`}
                      >
                        <CardContent className="p-4 sm:p-5">
                          <p 
                            className="text-sm sm:text-base text-foreground leading-relaxed break-words"
                            data-testid={`text-saved-transcript-${index}`}
                          >
                            "{text}"
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 sm:mt-16"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { icon: Sparkles, title: "AI-Powered", desc: "Advanced speech recognition" },
                { icon: AudioWaveform, title: "Real-time", desc: "Instant transcription" },
                { icon: Volume2, title: "Accurate", desc: "High-quality results" },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/30"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
