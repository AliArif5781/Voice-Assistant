import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Mic, MicOff, Volume2, Loader2, Sparkles, Waves, AudioWaveform,
  Zap, Shield, Globe, ArrowRight, ChevronDown, Brain, Clock, FileText,
  CheckCircle2, Star, Play, Headphones, MessageSquare, User, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";

import heroBg from "@assets/generated_images/futuristic_tech_sound_wave_background.png";
import orbImage from "@assets/generated_images/ai_voice_assistant_glowing_orb.png";

function FloatingParticles() {
  const [particles] = useState(() => {
    return [...Array(20)].map(() => ({
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

function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50' : ''
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <AudioWaveform className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:block">Vocalize AI</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-1">
            {['Features', 'How It Works', 'Try Now'].map((item) => (
              <Button
                key={item}
                variant="ghost"
                size="sm"
                onClick={() => scrollToSection(item.toLowerCase().replace(/\s+/g, '-'))}
                data-testid={`nav-${item.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt="" 
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="hidden sm:inline text-sm">
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }} 
                      className="text-red-500 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setLocation('/signin')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => setLocation('/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </nav>
    </motion.header>
  );
}

function HeroSection({ onTryNow }: { onTryNow: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent z-10" />
        <img 
          src={heroBg} 
          alt="" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>

      <FloatingParticles />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm text-muted-foreground">Powered by Gemini AI</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-gradient-vibrant">Transform</span>
              <br />
              <span className="text-foreground">Your Voice Into </span>
              <span className="text-gradient">Text</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
              Experience the future of speech-to-text with our advanced AI. 
              Simply speak, and watch your words come to life instantly with exceptional accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                onClick={onTryNow}
                data-testid="hero-try-now"
                className="text-base"
              >
                <Mic className="w-5 h-5" />
                Start Transcribing
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="hero-learn-more"
                className="text-base"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 border-2 border-background flex items-center justify-center"
                  >
                    <span className="text-xs font-medium text-white">{['JD', 'MK', 'LS', 'AR'][i]}</span>
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Trusted by 10,000+ users</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-3xl"
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.img
                src={orbImage}
                alt="AI Voice Assistant"
                className="relative z-10 w-full max-w-md mx-auto"
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-8 h-8 text-muted-foreground/50" />
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Leveraging Google's Gemini AI for state-of-the-art speech recognition with context awareness.",
      color: "from-violet-500 to-purple-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant transcriptions in real-time. No waiting, no delays - just seamless conversion.",
      color: "from-yellow-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your voice data is processed securely and never stored. Complete privacy guaranteed.",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Globe,
      title: "Multi-Language Support",
      description: "Transcribe speech in multiple languages with high accuracy and natural understanding.",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: FileText,
      title: "Export Options",
      description: "Save and export your transcriptions in various formats for easy sharing and storage.",
      color: "from-pink-500 to-rose-600"
    },
    {
      icon: Headphones,
      title: "Noise Reduction",
      description: "Advanced audio processing filters out background noise for clearer transcriptions.",
      color: "from-indigo-500 to-blue-600"
    }
  ];

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Everything You Need for </span>
            <span className="text-gradient">Perfect Transcription</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make voice-to-text conversion effortless and accurate.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full glass-panel border-border/50 overflow-visible group">
                <CardContent className="p-6 sm:p-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Click to Record",
      description: "Simply tap the microphone button to start recording your voice.",
      icon: Mic
    },
    {
      step: "02",
      title: "Speak Naturally",
      description: "Talk naturally - our AI understands context and nuance.",
      icon: MessageSquare
    },
    {
      step: "03",
      title: "Get Instant Results",
      description: "Watch as your speech is converted to text in real-time.",
      icon: FileText
    }
  ];

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            <Clock className="w-4 h-4" />
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">How It </span>
            <span className="text-gradient">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your voice into text.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-primary/50 to-transparent" />
              )}
              
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <step.icon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {step.step.slice(-1)}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: "99%", label: "Accuracy Rate" },
    { value: "50+", label: "Languages Supported" },
    { value: "10K+", label: "Happy Users" },
    { value: "<1s", label: "Processing Time" }
  ];

  return (
    <section className="py-20 sm:py-24 bg-gradient-to-r from-primary/10 via-background to-accent/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient-vibrant mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VoiceRecorderSection({ 
  isRecording, 
  isProcessing, 
  currentTranscript, 
  displayError,
  savedTranscripts,
  onToggleRecording 
}: {
  isRecording: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  displayError: string | null;
  savedTranscripts: string[];
  onToggleRecording: () => void;
}) {
  return (
    <section id="try-now" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Mic className="w-4 h-4" />
            Try It Now
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-foreground">Experience the </span>
            <span className="text-gradient">Magic</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Click the button below and start speaking. See your words transform in real-time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card glow-effect overflow-visible">
            <CardContent className="p-6 sm:p-8 md:p-10">
              <div className="flex flex-col items-center">
                <motion.div
                  className="relative mb-6 sm:mb-8"
                  animate={{ y: isRecording ? [-5, 5, -5] : 0 }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40">
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
                    onClick={onToggleRecording}
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

        <AnimatePresence>
          {savedTranscripts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-10"
            >
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <Waves className="w-5 h-5 text-primary" />
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                  Previous Recordings
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                  {savedTranscripts.length}
                </span>
              </div>
              
              <div className="grid gap-3 sm:gap-4">
                {savedTranscripts.slice(0, 3).map((text, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="glass-panel" 
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
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-card/50 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <AudioWaveform className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Vocalize AI</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Transform your voice into text with cutting-edge AI technology. 
              Fast, accurate, and secure.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              {['Features', 'How It Works', 'Pricing', 'API'].map((item) => (
                <li key={item}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-${item.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-${item.toLowerCase()}`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-${item.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2024 Vocalize AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Powered by Google Gemini AI
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const [savedTranscripts, setSavedTranscripts] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tryNowRef = useRef<HTMLElement>(null);

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

  const scrollToTryNow = () => {
    document.getElementById('try-now')?.scrollIntoView({ behavior: 'smooth' });
  };

  const displayError = error || recordingError;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      <HeroSection onTryNow={scrollToTryNow} />
      
      <FeaturesSection />
      
      <HowItWorksSection />
      
      <StatsSection />
      
      <VoiceRecorderSection
        isRecording={isRecording}
        isProcessing={isProcessing}
        currentTranscript={currentTranscript}
        displayError={displayError}
        savedTranscripts={savedTranscripts}
        onToggleRecording={handleToggleRecording}
      />
      
      <Footer />
    </div>
  );
}
