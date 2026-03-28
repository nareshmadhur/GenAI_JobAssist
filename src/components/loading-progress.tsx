'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_MESSAGES = [
  "Analyzing job requirements...",
  "Scanning your professional background...",
  "Mapping skills to role demands...",
  "Identifying key value propositions...",
  "Synthesizing coaching strategies...",
  "Drafting strategic talking points...",
  "Identifying potential interview gaps...",
  "Polishing final recommendations...",
];

interface LoadingProgressProps {
  messages?: string[];
  interval?: number;
  className?: string;
  isAllGeneration?: boolean;
}

export function LoadingProgress({ 
  messages = DEFAULT_MESSAGES, 
  interval = 3000,
  className,
  isAllGeneration = false
}: LoadingProgressProps) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % messages.length);
        setFade(true);
      }, 300); // fade out duration
    }, interval);

    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-6 text-center animate-in fade-in zoom-in duration-500", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
        <div className="relative bg-card border shadow-xl rounded-2xl p-6 flex items-center justify-center">
            {isAllGeneration ? (
                <Brain className="h-10 w-10 text-primary animate-bounce" />
            ) : (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            )}
        </div>
        <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-accent animate-pulse" />
      </div>
      
      <div className="space-y-2">
        <p className={cn(
          "text-lg font-semibold text-foreground transition-all duration-300",
          fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          {messages[index]}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto italic">
          {isAllGeneration 
            ? "Orchestrating your full application suite..." 
            : "Gemini is deep in thought, please wait..."}
        </p>
      </div>

      <div className="flex gap-1.5 justify-center">
        {messages.map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-all duration-300",
              i === index ? "w-4 bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
