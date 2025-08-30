
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
import type { ToolRequestPart } from 'genkit';

// Defines the shape of the tool context that the main page will provide.
export type ToolContext = {
  getFormFields?: () => Record<string, string>;
  updateFormFields?: (updates: Record<string, string>) => void;
  generateJobMaterial?: (generationType: string) => void;
};

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
  handleCoPilotSubmit: (message: string) => void;
  _handleCoPilotSubmitInternal: (
    message: string,
    toolContext?: ToolContext
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

  const handleCoPilotSubmit = (message: string) => {
    // This is a trick to allow the page to inject its context-specific tool handlers.
    if ((window as any)._handleCoPilotSubmit) {
      (window as any)._handleCoPilotSubmit(message);
    } else {
      _handleCoPilotSubmitInternal(message);
    }
  };

  const _handleCoPilotSubmitInternal = (
    message: string,
    toolContext?: ToolContext
  ) => {
    const newUserMessage: CoPilotMessage = { author: 'user', content: message };
    const currentChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentChatHistory);

    startGenerating(async () => {
      // Step 1: Send the user's message and get the initial response.
      const initialResponse = await generateCoPilotResponse({
        chatHistory: currentChatHistory,
      });

      if (initialResponse.error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: initialResponse.error,
        });
        setChatHistory(chatHistory); // Revert history
        return;
      }

      // Step 2: Check if the AI requested a tool.
      if (initialResponse.toolRequest) {
        const toolRequest = initialResponse.toolRequest as ToolRequestPart;
        let toolOutput: any = null;
        let requiresSecondCall = false;

        // Step 3: Execute the requested tool on the client-side.
        if (toolContext) {
          const { name, input } = toolRequest;
          if (name === 'getFormFields' && toolContext.getFormFields) {
            toolOutput = toolContext.getFormFields();
            requiresSecondCall = true; // We need to send this data back to the AI
          } else if (
            name === 'updateFormFields' &&
            toolContext.updateFormFields
          ) {
            toolContext.updateFormFields(input);
            toolOutput = `Successfully updated fields: ${Object.keys(
              input
            ).join(', ')}`;
            requiresSecondCall = true;
          } else if (
            name === 'generateJobMaterial' &&
            toolContext.generateJobMaterial
          ) {
            toolContext.generateJobMaterial(input.generationType);
            toolOutput = `Generating ${input.generationType}...`;
            requiresSecondCall = true;
          } else {
            toolOutput = { error: `Tool '${name}' not found or implemented.` };
            requiresSecondCall = true;
          }
        } else {
          toolOutput = { error: 'Tool context not available.' };
          requiresSecondCall = true;
        }

        if (requiresSecondCall) {
            const historyWithToolResponse: CoPilotMessage[] = [
            ...currentChatHistory,
            {
                author: 'tool',
                content: JSON.stringify(toolOutput),
                toolRequestId: toolRequest.id,
            },
            ];

            const finalResponse = await generateCoPilotResponse({
            chatHistory: historyWithToolResponse,
            });

            if (finalResponse.error) {
            toast({
                variant: 'destructive',
                title: 'Error after tool use',
                description: finalResponse.error,
            });
            setChatHistory(chatHistory); // Revert
            } else {
            setChatHistory((prev) => [
                ...prev,
                { author: 'assistant', content: finalResponse.response },
            ]);
            }
        } else {
            // This case might be for tools that don't need a follow-up, though our current ones do.
            setChatHistory((prev) => [
                ...prev,
                { author: 'assistant', content: initialResponse.response },
            ]);
        }
      } else {
        // If no tool was requested, just add the AI's response to the history.
        setChatHistory((prev) => [
          ...prev,
          { author: 'assistant', content: initialResponse.response },
        ]);
      }
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
    _handleCoPilotSubmitInternal,
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
