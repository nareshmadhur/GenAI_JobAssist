
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useTransition,
} from 'react';
import type { CoPilotMessage } from '@/lib/schemas';
import { generateCoPilotResponse } from '@/ai/flows/generate-co-pilot-response';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  bio: string;
  setBio: (bio: string) => void;
  chatHistory: CoPilotMessage[];
  setChatHistory: (history: CoPilotMessage[]) => void;
  isCoPilotSidebarOpen: boolean;
  setIsCoPilotSidebarOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isGenerating: boolean;
  handleCoPilotSubmit: (
    message: string,
    toolContext?: {
      getFormFields?: () => Record<string, string>;
      updateFormFields?: (updates: Record<string, string>) => void;
      generateJobMaterial?: (generationType: string) => void;
    }
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_APP = 'jobspark_app_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [bio, setBio] = useState('');
  const [chatHistory, setChatHistory] = useState<CoPilotMessage[]>([]);
  const [isCoPilotSidebarOpen, setIsCoPilotSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();

  // Load state from localStorage on initial mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY_APP);
      if (savedData) {
        const { bio: savedBio, history: savedHistory } = JSON.parse(savedData);
        if (savedBio) setBio(savedBio);
        if (savedHistory && savedHistory.length > 0) {
          setChatHistory(savedHistory);
        } else {
           setChatHistory([
            {
              author: 'assistant',
              content:
                "Hello! I'm your Co-pilot. I can help you with your application. Try asking me to 'improve your bio' or 'generate a cover letter'.",
            },
          ]);
        }
      } else {
        // Set initial message if no history
        setChatHistory([
          {
            author: 'assistant',
            content:
              "Hello! I'm your Co-pilot. I can help you with your application. Try asking me to 'improve your bio' or 'generate a cover letter'.",
          },
        ]);
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

  const handleCoPilotSubmit = (
    message: string,
    toolContext?: {
      getFormFields?: () => Record<string, string>;
      updateFormFields?: (updates: Record<string, string>) => void;
      generateJobMaterial?: (generationType: string) => void;
    }
  ) => {
    const newUserMessage: CoPilotMessage = { author: 'user', content: message };
    const newChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(newChatHistory);

    startGenerating(async () => {
      const response = await generateCoPilotResponse({
        chatHistory: newChatHistory,
      });

      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: response.error,
        });
        // Revert to previous history on error
        setChatHistory(chatHistory);
        return;
      }
      
      // Handle tool requests
      if (response.toolRequest) {
        const toolRequest = response.toolRequest;
        const toolName = toolRequest.name;
        const toolInput = toolRequest.input;

        if (toolContext) {
            if (toolName === 'getFormFields' && toolContext.getFormFields) {
                const formData = toolContext.getFormFields();
                toolRequest.resolve(formData);
            } else if (toolName === 'updateFormFields' && toolContext.updateFormFields) {
                toolContext.updateFormFields(toolInput);
                toolRequest.resolve(toolInput);
            } else if (toolName === 'generateJobMaterial' && toolContext.generateJobMaterial) {
                toolContext.generateJobMaterial(toolInput.generationType);
                toolRequest.resolve(toolInput);
            }
        }
      }

      setChatHistory((prev) => [...prev, { author: 'assistant', content: response.response }]);
    });
  };

  const value = {
    bio,
    setBio,
    chatHistory,
    setChatHistory,
    isCoPilotSidebarOpen,
    setIsCoPilotSidebarOpen,
    isLoading,
    setIsLoading,
    isGenerating,
    handleCoPilotSubmit,
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
