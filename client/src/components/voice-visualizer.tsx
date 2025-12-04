import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  isListening: boolean;
}

export function VoiceVisualizer({ isListening }: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>(new Array(5).fill(10));

  useEffect(() => {
    if (!isListening) {
      setBars(new Array(5).fill(10));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 40 + 10));
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-accent rounded-full"
          animate={{ height: isListening ? height : 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      ))}
    </div>
  );
}
