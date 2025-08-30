
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { BioChatMessage } from '@/lib/schemas';

interface AppContextType {
  bio: string;
  setBio: (bio: string) => void;
  chatHistory: BioChatMessage[];
  setChatHistory: (history: BioChatMessage[]) => void;
  isCoPilotSidebarOpen: boolean;
  setIsCoPilotSidebarOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_APP = 'jobspark_app_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [bio, setBio] = useState('');
  const [chatHistory, setChatHistory] = useState<BioChatMessage[]>([]);
  const [isCoPilotSidebarOpen, setIsCoPilotSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY_APP);
      if (savedData) {
        const { bio: savedBio, history: savedHistory } = JSON.parse(savedData);
        if (savedBio) setBio(savedBio);
        if (savedHistory) setChatHistory(savedHistory);
      } else {
        // Set initial message if no history
        setChatHistory([{
          author: 'assistant',
          content: "Hello! I'm your Co-pilot. I can help you build a professional bio. You can either answer my questions, or just paste your resume and I'll structure it for you.",
          suggestedReplies: ["Add my name", "Paste my resume"],
        }]);
      }
    } catch (e) {
      console.error('Failed to load app data from localStorage', e);
    }
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
        try {
            const dataToSave = {
            bio: bio,
            history: chatHistory,
            };
            localStorage.setItem(LOCAL_STORAGE_KEY_APP, JSON.stringify(dataToSave));
        } catch (e) {
            console.error('Failed to save app data to localStorage', e);
        }
    }
  }, [bio, chatHistory, isLoading]);
  
  const value = {
    bio,
    setBio,
    chatHistory,
    setChatHistory,
    isCoPilotSidebarOpen,
    setIsCoPilotSidebarOpen,
    isLoading,
    setIsLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
