import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Mic, MicOff, Volume2, Loader2, AudioWaveform, ArrowLeft, 
  Waves, Copy, Check, Trash2, Download, Cloud, Pencil, X, Calendar as CalendarIcon, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useAuth } from "@/contexts/AuthContext";
import { saveToFirestore, isFirebaseConfigured, getUserTranscriptions, updateFirestoreDoc, deleteFirestoreDoc } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useReminders } from "@/hooks/use-reminders";
import { format } from "date-fns";
import { extractTasksFromText, ExtractedTask as ParsedTask } from "@/lib/time-parser";

import orbImage from "@assets/generated_images/ai_voice_assistant_glowing_orb.png";

interface TranscriptItem {
  id: string;
  text: string;
  savedToCloud: boolean;
  completed: boolean;
  scheduledAt?: string | null;
}

interface ExtractedTask {
  text: string;
  reminderTime: string | null;
  originalTimeText: string | null;
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
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Date/time picker state for saving
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  
  const firebaseConfigured = isFirebaseConfigured();

  const {
    isRecording,
    error: recordingError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useReminders(savedTranscripts);

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
          scheduledAt: doc.scheduledAt || null,
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
      const pendingDate = localStorage.getItem('pendingTranscriptDate');
      
      if (pendingTranscript && user && firebaseConfigured) {
        setIsSavingToCloud(true);
        try {
          const docId = await saveToFirestore('transcriptions', {
            text: pendingTranscript,
            userId: user.uid,
            userEmail: user.email,
            displayName: user.displayName || null,
            createdAt: new Date().toISOString(),
            scheduledAt: pendingDate || null,
            completed: false,
          });
          
          localStorage.removeItem('pendingTranscript');
          localStorage.removeItem('pendingTranscriptDate');
          
          toast({
            title: "Saved",
            description: "Your transcription has been saved to your account.",
          });
          setSavedTranscripts(prev => [{
            id: docId,
            text: pendingTranscript,
            savedToCloud: true,
            completed: false,
            scheduledAt: pendingDate || null,
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
          localStorage.removeItem('pendingTranscriptDate');
        } finally {
          setIsSavingToCloud(false);
        }
      }
    };
    
    savePendingTranscript();
  }, [user, firebaseConfigured, toast]);

  const extractTasksFromTranscript = (transcript: string) => {
    setIsExtracting(true);
    try {
      const tasks = extractTasksFromText(transcript);
      setExtractedTasks(tasks);
    } catch (err) {
      console.error('Task extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsProcessing(true);
      setError(null);
      setCurrentTranscript("");
      setExtractedTasks([]);
      
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
                await extractTasksFromTranscript(transcript);
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
      setExtractedTasks([]);
      await startRecording();
    }
  };

  const handleOpenDatePicker = () => {
    if (!currentTranscript || currentTranscript.includes("No speech detected")) return;
    
    // Initialize with current date/time
    const now = new Date();
    setSelectedDate(now);
    setSelectedHour(now.getHours().toString().padStart(2, '0'));
    setSelectedMinute(now.getMinutes().toString().padStart(2, '0'));
    setShowDatePicker(true);
  };

  const handleSaveWithDate = async () => {
    if (!currentTranscript || currentTranscript.includes("No speech detected")) return;
    
    // Build the scheduled date/time
    let scheduledAt: string | null = null;
    if (selectedDate) {
      const dateTime = new Date(selectedDate);
      dateTime.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
      scheduledAt = dateTime.toISOString();
    }
    
    if (!user) {
      localStorage.setItem('pendingTranscript', currentTranscript);
      if (scheduledAt) {
        localStorage.setItem('pendingTranscriptDate', scheduledAt);
      }
      toast({
        title: "Sign in required",
        description: "Please sign in to save your transcription.",
      });
      setLocation("/signin");
      return;
    }
    
    setIsSavingToCloud(true);
    setShowDatePicker(false);
    
    try {
      if (firebaseConfigured) {
        const docId = await saveToFirestore('transcriptions', {
          text: currentTranscript,
          userId: user.uid,
          userEmail: user.email,
          displayName: user.displayName || null,
          createdAt: new Date().toISOString(),
          scheduledAt: scheduledAt,
          completed: false,
        });
        
        toast({
          title: "Saved",
          description: scheduledAt 
            ? `Saved for ${format(new Date(scheduledAt), "PPP 'at' p")}`
            : "Your transcription has been saved.",
        });
        setSavedTranscripts(prev => [{
          id: docId,
          text: currentTranscript,
          savedToCloud: true,
          completed: false,
          scheduledAt: scheduledAt,
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
    setExtractedTasks([]);
    setShowDatePicker(false);
    toast({
      title: "Discarded",
      description: "Transcription has been removed.",
    });
  };

  const handleSaveExtractedTasks = async () => {
    if (!user) {
      localStorage.setItem('pendingTranscript', currentTranscript);
      toast({
        title: "Sign in required",
        description: "Please sign in to save your tasks.",
      });
      setLocation("/signin");
      return;
    }

    if (!firebaseConfigured) {
      toast({
        title: "Error",
        description: "Firebase is not configured.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingToCloud(true);
    
    try {
      const savedItems: TranscriptItem[] = [];
      
      for (const task of extractedTasks) {
        const docId = await saveToFirestore('transcriptions', {
          text: task.text,
          userId: user.uid,
          userEmail: user.email,
          displayName: user.displayName || null,
          createdAt: new Date().toISOString(),
          scheduledAt: task.reminderTime,
          originalTimeText: task.originalTimeText,
          completed: false,
        });
        
        savedItems.push({
          id: docId,
          text: task.text,
          savedToCloud: true,
          completed: false,
          scheduledAt: task.reminderTime,
        });
      }
      
      toast({
        title: "Saved",
        description: `${savedItems.length} task${savedItems.length > 1 ? 's' : ''} saved successfully.`,
      });
      
      setSavedTranscripts(prev => [...savedItems, ...prev]);
      setCurrentTranscript("");
      setExtractedTasks([]);
    } catch (err: any) {
      console.error('Failed to save tasks:', err);
      toast({
        title: "Save Failed",
        description: err.message || "Failed to save tasks.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToCloud(false);
    }
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

  const generateTimeOptions = (type: 'hour' | 'minute') => {
    if (type === 'hour') {
      return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    }
    return Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
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
    const content = savedTranscripts.map(t => {
      let line = t.completed ? '[COMPLETED] ' : '';
      if (t.scheduledAt) {
        line += `[${format(new Date(t.scheduledAt), "PPP p")}] `;
      }
      line += t.text;
      return line;
    }).join('\n\n---\n\n');
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
  
  const sortedTranscripts = [...savedTranscripts].sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return 0;
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

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
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording
                        ? 'bg-red-500 shadow-lg shadow-red-500/50'
                        : isProcessing
                          ? 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
                          : 'bg-primary shadow-lg shadow-primary/50'
                    }`}
                    data-testid="button-toggle-recording"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="w-8 h-8 text-white" />
                    ) : (
                      <Mic className="w-8 h-8 text-white" />
                    )}
                  </button>
                </motion.div>

                <p className="mt-4 text-sm text-muted-foreground">
                  {isProcessing 
                    ? "Processing your speech..." 
                    : isRecording 
                      ? "Listening... Click to stop" 
                      : "Click to start recording"}
                </p>

                {displayError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <p className="text-sm text-destructive">{displayError}</p>
                  </motion.div>
                )}

                <AnimatePresence>
                  {currentTranscript && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-6 w-full"
                    >
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-start gap-2 mb-2">
                          <Volume2 className="w-4 h-4 text-primary mt-0.5" />
                          <span className="text-xs text-muted-foreground">Transcription</span>
                        </div>
                        <p className="text-foreground" data-testid="text-current-transcript">{currentTranscript}</p>
                      </div>

                      {!currentTranscript.includes("No speech detected") && !currentTranscript.includes("No audio recorded") && (
                        <div className="mt-4 space-y-3">
                          {isExtracting && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Extracting tasks...</span>
                            </div>
                          )}
                          
                          {extractedTasks.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground font-medium">
                                  Extracted Tasks ({extractedTasks.length})
                                </span>
                              </div>
                              {extractedTasks.map((task, idx) => (
                                <div 
                                  key={idx}
                                  className="p-3 rounded-lg bg-accent/20 border border-accent/30"
                                  data-testid={`extracted-task-${idx}`}
                                >
                                  <p className="text-sm text-foreground">{task.text}</p>
                                  {task.reminderTime && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <CalendarIcon className="w-3 h-3 text-primary" />
                                      <span className="text-xs text-primary">
                                        {format(new Date(task.reminderTime), "PPP 'at' p")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {extractedTasks.length > 0 ? (
                            <div className="flex gap-2">
                              <Button
                                onClick={handleSaveExtractedTasks}
                                disabled={isSavingToCloud}
                                className="flex-1"
                                data-testid="button-save-tasks"
                              >
                                {isSavingToCloud ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Cloud className="w-4 h-4 mr-2" />
                                    Save {extractedTasks.length} Task{extractedTasks.length > 1 ? 's' : ''}
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleDiscard}
                                data-testid="button-discard-transcript"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : !isExtracting && (
                            <>
                              {showDatePicker && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-4 rounded-lg bg-muted/50 border border-border space-y-4"
                                >
                                  <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                    <h4 className="font-medium text-sm">Set Date & Time</h4>
                                  </div>
                                  
                                  <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    initialFocus
                                    className="rounded-md border mx-auto"
                                  />
                                  
                                  <div className="flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Time:</span>
                                    <Select value={selectedHour} onValueChange={setSelectedHour}>
                                      <SelectTrigger className="w-20" data-testid="select-hour">
                                        <SelectValue placeholder="Hour" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {generateTimeOptions('hour').map((h) => (
                                          <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <span>:</span>
                                    <Select value={selectedMinute} onValueChange={setSelectedMinute}>
                                      <SelectTrigger className="w-20" data-testid="select-minute">
                                        <SelectValue placeholder="Min" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {generateTimeOptions('minute').map((m) => (
                                          <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={handleSaveWithDate}
                                      disabled={isSavingToCloud || !selectedDate}
                                      className="flex-1"
                                      data-testid="button-confirm-save"
                                    >
                                      {isSavingToCloud ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        <>
                                          <Cloud className="w-4 h-4 mr-2" />
                                          Save
                                        </>
                                      )}
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      onClick={() => setShowDatePicker(false)}
                                      data-testid="button-cancel-date"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </motion.div>
                              )}

                              {!showDatePicker && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleOpenDatePicker}
                                    disabled={isSavingToCloud}
                                    className="flex-1"
                                    data-testid="button-save-transcript"
                                  >
                                    <Cloud className="w-4 h-4 mr-2" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={handleDiscard}
                                    data-testid="button-discard-transcript"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
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
          >
            <Card className="glass-card overflow-visible h-full">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Saved Transcriptions</h2>
                    {savedTranscripts.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({completedCount}/{savedTranscripts.length} done)
                      </span>
                    )}
                  </div>
                  {savedTranscripts.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExport}
                        className="gap-1"
                        data-testid="button-export"
                      >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearAll}
                        className="gap-1 text-destructive"
                        data-testid="button-clear-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear All</span>
                      </Button>
                    </div>
                  )}
                </div>

                <AnimatePresence mode="popLayout">
                  {isLoadingTranscripts ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    </div>
                  ) : savedTranscripts.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Waves className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">No transcriptions yet</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Start recording to see your transcriptions here
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {sortedTranscripts.map((item, index) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`group p-4 rounded-lg border transition-all ${
                            item.completed 
                              ? 'bg-muted/30 border-border/50' 
                              : 'bg-muted/50 border-border'
                          }`}
                        >
                          {editingId === item.id ? (
                            <div className="space-y-3">
                              <Textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="min-h-[100px] text-sm"
                                autoFocus
                                data-testid={`textarea-edit-${item.id}`}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  data-testid={`button-cancel-edit-${item.id}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(item.id)}
                                  data-testid={`button-save-edit-${item.id}`}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => handleToggleCompleted(item.id)}
                                  className="mt-1"
                                  data-testid={`checkbox-complete-${item.id}`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm text-foreground break-words ${
                                    item.completed ? 'line-through opacity-60' : ''
                                  }`} data-testid={`text-transcript-${item.id}`}>
                                    {item.text}
                                  </p>
                                  {item.scheduledAt && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <CalendarIcon className="w-3 h-3 text-primary" />
                                      <span className="text-xs text-primary">
                                        {format(new Date(item.scheduledAt), "PPP 'at' p")}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!item.completed && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(item)}
                                    data-testid={`button-edit-${item.id}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleCopy(item.text, index)}
                                  data-testid={`button-copy-${item.id}`}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-destructive"
                                  data-testid={`button-delete-${item.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
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
