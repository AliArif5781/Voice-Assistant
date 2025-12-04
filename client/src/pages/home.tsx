import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Zap, Shield, Database, Menu, X, ArrowRight, Play } from "lucide-react";
import { VoiceVisualizer } from "@/components/voice-visualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Import generated assets
import heroBg from "@assets/generated_images/abstract_neon_sound_wave_visualization.png";
import orbImage from "@assets/generated_images/glowing_ai_voice_interface_orb.png";

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [demoText, setDemoText] = useState("Click the microphone to speak...");

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setDemoText("Listening...");
      setTimeout(() => {
        setDemoText("Searching database...");
        setIsListening(false);
        setTimeout(() => {
          setDemoText("Here is what I found in your Firestore database.");
        }, 1000);
      }, 3000);
    } else {
      setDemoText("Click the microphone to speak...");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
            </div>
            <span className="text-xl font-heading font-bold tracking-tight text-white">Vocalize AI</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Live Demo</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 hover:text-primary">Log in</Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card border-l border-white/10">
                <div className="flex flex-col gap-6 mt-10">
                  <a href="#features" className="text-lg font-medium">Features</a>
                  <a href="#demo" className="text-lg font-medium">Live Demo</a>
                  <a href="#pricing" className="text-lg font-medium">Pricing</a>
                  <div className="flex flex-col gap-3 mt-4">
                    <Button variant="outline" className="w-full">Log in</Button>
                    <Button className="w-full">Get Started</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background z-10" />
          <img 
            src={heroBg} 
            alt="Sound Wave Background" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <div className="container mx-auto px-6 relative z-20">
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            {/* Text Content */}
            <div className="flex-1 text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Powered by Firebase & AI
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
                  Your Voice, <br />
                  <span className="text-gradient">Amplified by Intelligence.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed">
                  Control your digital world with natural conversation. Our advanced voice assistant integrates seamlessly with your data.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base shadow-[0_0_20px_-5px_hsla(var(--primary)/0.5)] w-full sm:w-auto">
                    Start Speaking <Mic className="w-4 h-4 ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 h-12 px-8 text-base w-full sm:w-auto">
                    Watch Demo <Play className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Visual Content */}
            <div className="flex-1 flex justify-center relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px]"
              >
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
                <img 
                  src={orbImage} 
                  alt="AI Interface" 
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]"
                />
                
                {/* Floating Elements */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 p-4 glass-panel rounded-2xl z-20 hidden md:block"
                >
                  <Database className="w-6 h-6 text-accent mb-2" />
                  <div className="text-xs font-mono text-muted-foreground">Firestore Connected</div>
                  <div className="text-sm font-bold">Syncing Data...</div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-10 -left-8 p-4 glass-panel rounded-2xl z-20 hidden md:block"
                >
                  <VoiceVisualizer isListening={true} />
                  <div className="text-xs font-mono text-center mt-2 text-primary">Processing Voice</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-background relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Professional Grade Capabilities</h2>
            <p className="text-muted-foreground">Built for enterprise scale with the speed of a startup. Security, speed, and reliability included.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-accent" />,
                title: "Lightning Fast",
                desc: "Real-time processing with <50ms latency for natural, fluid conversations."
              },
              {
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: "Enterprise Secure",
                desc: "End-to-end encryption ensures your voice data remains private and secure."
              },
              {
                icon: <Database className="w-6 h-6 text-purple-400" />,
                title: "Firebase Integration",
                desc: "Seamlessly connect with Cloud Firestore for real-time data persistence."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:bg-card/80 transition-colors group">
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-secondary/20 skew-y-3 transform origin-top-left scale-110" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <h2 className="text-3xl font-heading font-bold mb-8">Try it Live</h2>
                
                <div className="w-full max-w-md bg-black/40 rounded-2xl p-6 mb-8 border border-white/5 min-h-[120px] flex flex-col items-center justify-center">
                  <VoiceVisualizer isListening={isListening} />
                  <p className="mt-4 text-lg font-medium text-white/90 transition-all">
                    "{demoText}"
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={toggleListening}
                  className={`h-16 w-16 rounded-full p-0 transition-all duration-300 ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                      : 'bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(56,189,248,0.4)]'
                  }`}
                >
                  {isListening ? (
                    <div className="w-4 h-4 bg-white rounded-sm" />
                  ) : (
                    <Mic className="w-8 h-8 text-primary-foreground" />
                  )}
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">Tap to interact with the AI</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary" />
              <span className="font-heading font-bold text-lg">Vocalize AI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Vocalize AI. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
