import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Mic, MicOff, Volume2, Loader2, AudioWaveform, ArrowLeft, 
  Waves, Copy, Check, Trash2, Download, Cloud, Pencil, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useAuth } from "@/contexts/AuthContext";
import { saveToFirestore, isFirebaseConfigured, getUserTranscriptions, updateFirestoreDoc, deleteFirestoreDoc } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import orbImage from "@assets/generated_images/ai_voice_assistant_glowing_orb.png";

interface TranscriptItem {
  id: string;
  text: string;
  savedToCloud: boolean;
  completed: boolean;
}

function VoiceWaveform({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-primary to-accent"
          animate={{
            height: isActive ? [12, Math.random() * 48 + 20, 12] : 12,
          }}
          transition={{
            duration: 0.4,
            repeat: isActive ? Infinity : 0,
            delay: i * 0.04,
          }}
        />
      ))}
    </div>
  );
}

export default function Transcribe() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedTranscripts, setSavedTranscripts] = useState<TranscriptItem[]>([]);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const firebaseConfigured = isFirebaseConfigured();

  const {
    isRecording,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useEffect(() => {
    const loadTranscriptions = async () => {
      if (!user || !firebaseConfigured) {
        setSavedTranscripts([]);
        return;
      }

      setIsLoadingTranscripts(true);
      try {
        const transcriptions = await getUserTranscriptions(user.uid);
        const items: TranscriptItem[] = transcriptions.map((doc: any) => ({
          id: doc.id,
          text: doc.text || "",
          savedToCloud: true,
          completed: doc.completed || false,
        }));
        setSavedTranscripts(items);
      } catch (err: any) {
        console.error('Failed to load transcriptions:', err);
        toast({
          title: "Failed to load",
          description: "Could not load your saved transcriptions.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingTranscripts(false);
      }
    };

    loadTranscriptions();
  }, [user, firebaseConfigured, toast]);

  useEffect(() => {
    const savePendingTranscript = async () => {
      const pendingTranscript = localStorage.getItem('pendingTranscript');
      
      if (pendingTranscript && user && firebaseConfigured) {
        setIsSavingToCloud(true);
        try {
          const docId = await saveToFirestore('transcriptions', {
            text: pendingTranscript,
            userId: user.uid,
            userEmail: user.email,
            displayName: user.displayName || null,
            createdAt: new Date().toISOString(),
            completed: false,
          });
          
          localStorage.removeItem('pendingTranscript');
          
          toast({
            title: "Saved",
            description: "Your transcription has been saved to your account.",
          });
          setSavedTranscripts(prev => [{
            id: docId,
            text: pendingTranscript,
            savedToCloud: true,
            completed: false
          }, ...prev]);
        } catch (err: any) {
          console.error('Failed to save pending transcript:', err);
          toast({
            title: "Save Failed",
            description: err.message || "Failed to save. Please try again.",
            variant: "destructive",
          });
          setCurrentTranscript(pendingTranscript);
          localStorage.removeItem('pendingTranscript');
        } finally {
          setIsSavingToCloud(false);
        }
      }
    };
    
    savePendingTranscript();
  }, [user, firebaseConfigured, toast]);

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

  const handleSave = async () => {
    if (!currentTranscript || currentTranscript.includes("No speech detected")) return;
    
    if (!user) {
      localStorage.setItem('pendingTranscript', currentTranscript);
      toast({
        title: "Sign in required",
        description: "Please sign in to save your transcription.",
      });
      setLocation("/signin");
      return;
    }
    
    setIsSavingToCloud(true);
    
    try {
      if (firebaseConfigured) {
        const docId = await saveToFirestore('transcriptions', {
          text: currentTranscript,
          userId: user.uid,
          userEmail: user.email,
          displayName: user.displayName || null,
          createdAt: new Date().toISOString(),
          completed: false,
        });
        
        toast({
          title: "Saved",
          description: "Your transcription has been saved to your account.",
        });
        setSavedTranscripts(prev => [{
          id: docId,
          text: currentTranscript,
          savedToCloud: true,
          completed: false
        }, ...prev]);
        setCurrentTranscript("");
      } else {
        toast({
          title: "Error",
          description: "Firebase is not configured. Please contact support.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('Failed to save:', err);
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleDiscard = () => {
    setCurrentTranscript("");
    toast({
      title: "Discarded",
      description: "Transcription has been removed.",
    });
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFirestoreDoc('transcriptions', id);
      setSavedTranscripts(prev => prev.filter(item => item.id !== id));
      toast({
        title: "Deleted",
        description: "Transcription has been removed.",
      });
    } catch (err: any) {
      console.error('Failed to delete:', err);
      toast({
        title: "Delete Failed",
        description: err.message || "Failed to delete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleCompleted = async (id: string) => {
    const item = savedTranscripts.find(t => t.id === id);
    if (!item) return;

    const newCompleted = !item.completed;
    
    setSavedTranscripts(prev => prev.map(t => 
      t.id === id ? { ...t, completed: newCompleted } : t
    ));

    try {
      await updateFirestoreDoc('transcriptions', id, { completed: newCompleted });
    } catch (err: any) {
      console.error('Failed to update completion status:', err);
      setSavedTranscripts(prev => prev.map(t => 
        t.id === id ? { ...t, completed: !newCompleted } : t
      ));
      toast({
        title: "Update Failed",
        description: "Could not update completion status.",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (item: TranscriptItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) {
      toast({
        title: "Error",
        description: "Text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    const trimmedText = editText.trim();
    const originalItem = savedTranscripts.find(t => t.id === id);
    
    setSavedTranscripts(prev => prev.map(item => 
      item.id === id ? { ...item, text: trimmedText } : item
    ));
    setEditingId(null);
    setEditText("");

    try {
      await updateFirestoreDoc('transcriptions', id, { text: trimmedText });
      toast({
        title: "Updated",
        description: "Transcription has been updated.",
      });
    } catch (err: any) {
      console.error('Failed to update:', err);
      if (originalItem) {
        setSavedTranscripts(prev => prev.map(item => 
          item.id === id ? { ...item, text: originalItem.text } : item
        ));
      }
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    if (savedTranscripts.length === 0) return;

    const previousTranscripts = [...savedTranscripts];
    setSavedTranscripts([]);
    setCurrentTranscript("");

    try {
      await Promise.all(
        previousTranscripts.map(item => deleteFirestoreDoc('transcriptions', item.id))
      );
      toast({
        title: "Cleared",
        description: "All transcriptions have been deleted.",
      });
    } catch (err: any) {
      console.error('Failed to clear all:', err);
      setSavedTranscripts(previousTranscripts);
      toast({
        title: "Clear Failed",
        description: "Could not delete all transcriptions.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const content = savedTranscripts.map(t => `${t.completed ? '[COMPLETED] ' : ''}${t.text}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcriptions.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayError = error || recordingError;
  const completedCount = savedTranscripts.filter(t => t.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />

      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <AudioWaveform className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-foreground">Voice Transcription</span>
            </div>

            <div className="w-24" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="text-foreground">Voice to </span>
            <span className="text-gradient">Text</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Click the microphone and start speaking. Your words will be transcribed in real-time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-card glow-effect overflow-visible h-full">
              <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[400px]">
                <motion.div
                  className="relative mb-6"
                  animate={{ y: isRecording ? [-5, 5, -5] : 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44">
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

                <div className="mb-6">
                  <VoiceWaveform isActive={isRecording} />
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={handleToggleRecording}
                    disabled={isProcessing}
                    data-testid="button-mic-toggle"
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-50 ${
                      isRecording 
                        ? 'bg-gradient-to-br from-red-500 to-red-600 glow-recording' 
                        : isProcessing
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-600'
                          : 'bg-gradient-to-br from-primary to-cyan-500 glow-effect'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-10 h-10 text-white" />
                    ) : isProcessing ? (
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>
                </motion.div>

                <p className="mt-4 text-base text-muted-foreground text-center">
                  {isRecording 
                    ? "Recording... Tap to stop" 
                    : isProcessing 
                      ? "Processing your speech..." 
                      : "Tap to start recording"}
                </p>

                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg w-full max-w-sm"
                    >
                      <p className="text-sm text-destructive text-center" data-testid="text-error">
                        {displayError}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Waves className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Transcriptions</h2>
                {savedTranscripts.length > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                    {completedCount}/{savedTranscripts.length} completed
                  </span>
                )}
              </div>
              {savedTranscripts.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleExport}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearAll}
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                </div>
              )}
            </div>

            <Card className="glass-panel flex-1 overflow-hidden">
              <CardContent className="p-4 sm:p-6 h-full min-h-[350px] max-h-[500px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {currentTranscript && (
                    <motion.div
                      key="current"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-primary/20">
                            <Volume2 className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-foreground leading-relaxed flex-1" data-testid="text-current-speech">
                            {currentTranscript}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(currentTranscript, -1)}
                          className="shrink-0"
                        >
                          {copiedIndex === -1 ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      
                      {!currentTranscript.includes("No speech detected") && (
                        <div className="flex items-center gap-2 mt-4 ml-11">
                          <Button
                            onClick={handleSave}
                            disabled={isSavingToCloud}
                            className="gap-2"
                            data-testid="button-save"
                          >
                            {isSavingToCloud ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            {isSavingToCloud ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDiscard}
                            className="gap-2 text-destructive"
                            data-testid="button-delete"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 ml-11">Review your transcription above</p>
                    </motion.div>
                  )}

                  {isLoadingTranscripts ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-12"
                    >
                      <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                      <p className="text-muted-foreground">Loading your transcriptions...</p>
                    </motion.div>
                  ) : savedTranscripts.length === 0 && !currentTranscript ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full text-center py-12"
                    >
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <Mic className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No transcriptions yet
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Click the microphone to start recording
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {savedTranscripts.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 border rounded-lg group transition-colors ${
                            item.completed 
                              ? 'bg-green-500/10 border-green-500/30' 
                              : 'bg-background/50 border-border/30'
                          }`}
                        >
                          {editingId === item.id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-[80px] resize-none"
                                data-testid={`input-edit-${index}`}
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="gap-1"
                                  data-testid={`button-save-edit-${index}`}
                                >
                                  <Check className="w-3 h-3" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="gap-1"
                                  data-testid={`button-cancel-edit-${index}`}
                                >
                                  <X className="w-3 h-3" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className="pt-0.5">
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => handleToggleCompleted(item.id)}
                                  data-testid={`checkbox-complete-${index}`}
                                  className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p 
                                  className={`text-sm leading-relaxed ${
                                    item.completed 
                                      ? 'text-muted-foreground line-through' 
                                      : 'text-foreground'
                                  }`}
                                  data-testid={`text-transcript-${index}`}
                                >
                                  {item.text}
                                </p>
                                {item.completed && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 text-xs text-green-500">
                                      <Check className="w-3 h-3" />
                                      Completed
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!item.completed && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleStartEdit(item)}
                                    className="h-8 w-8"
                                    data-testid={`button-edit-${index}`}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopy(item.text, index)}
                                  className="h-8 w-8"
                                  data-testid={`button-copy-${index}`}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(item.id)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  data-testid={`button-delete-${index}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
