import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

import heroBg from "@assets/generated_images/abstract_neon_sound_wave_visualization.png";

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
              Click the microphone, speak, and see your words appear
            </p>
          </div>

          {/* Voice Input Card */}
          <Card className="bg-card/80 backdrop-blur-md border-border/50 mb-8">
            <CardContent className="p-8">
              {/* Microphone Button */}
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  onClick={handleToggleRecording}
                  disabled={isProcessing}
                  data-testid="button-mic-toggle"
                  className={`h-24 w-24 rounded-full p-0 transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse' 
                      : isProcessing
                        ? 'bg-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.4)]'
                        : 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-10 h-10 text-white" />
                  ) : isProcessing ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <Mic className="w-10 h-10 text-primary-foreground" />
                  )}
                </Button>

                <p className="mt-4 text-sm text-muted-foreground">
                  {isRecording 
                    ? "Recording... Click to stop and transcribe" 
                    : isProcessing 
                      ? "Transcribing your speech..." 
                      : "Click to start recording"}
                </p>
              </div>

              {/* Current Speech Display */}
              <div className="mt-8 min-h-[120px] p-6 bg-background/50 rounded-xl border border-border/30">
                <div className="flex items-start gap-3">
                  <Volume2 className={`w-5 h-5 mt-1 flex-shrink-0 ${isRecording ? 'text-red-500 animate-pulse' : isProcessing ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  <div className="flex-1">
                    {isRecording ? (
                      <p className="text-lg text-foreground leading-relaxed" data-testid="text-recording-status">
                        Listening to you speak...
                        <span className="animate-pulse text-red-500"> [Recording]</span>
                      </p>
                    ) : isProcessing ? (
                      <p className="text-lg text-yellow-500 leading-relaxed flex items-center gap-2" data-testid="text-processing-status">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing your audio...
                      </p>
                    ) : currentTranscript ? (
                      <p className="text-lg text-foreground leading-relaxed" data-testid="text-current-speech">
                        {currentTranscript}
                      </p>
                    ) : (
                      <p className="text-lg text-muted-foreground italic" data-testid="text-placeholder">
                        Your speech will appear here
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {displayError && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive" data-testid="text-error">
                    {displayError}
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
