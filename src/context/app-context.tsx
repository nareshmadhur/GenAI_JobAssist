
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
  setToolContext: (context: ToolContext | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_APP = 'jobspark_app_data';

export function AppProvider({ children }: { children: ReactNode }) {
  const [bio, setBio] = useState('');
  const [chatHistory, setChatHistory] = useState<CoPilotMessage[]>([]);
  const [isCoPilotSidebarOpen, setIsCoPilotSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, startGenerating] = useTransition();
  const [toolContext, setToolContext] = useState<ToolContext | null>(null);
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
    const newUserMessage: CoPilotMessage = { author: 'user', content: message };
    const currentChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentChatHistory);

    startGenerating(async () => {
      // This function will be called recursively if a tool is used.
      const runGeneration = async (history: CoPilotMessage[]) => {
        if (!toolContext?.getFormFields) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Form context is not available. Cannot submit.',
          });
          return;
        }
        const { bio, jobDescription } = toolContext.getFormFields();

        const response = await generateCoPilotResponse({
          chatHistory: history,
          bio,
          jobDescription,
        });

        // Check if the AI requested a tool.
        if (response.toolRequest) {
          const toolRequest = response.toolRequest as ToolRequestPart;
          let toolOutput: any = null;
          
          const toolStepMessage: CoPilotMessage = {
            author: 'assistant',
            type: 'tool-step',
            content: `Using tool: **${toolRequest.name}**...`,
          };
          
          let historyWithSteps = [...history, toolStepMessage];
          setChatHistory(historyWithSteps);
          
          // Execute the requested tool on the client-side.
          const { name, input } = toolRequest;
          if (name === 'updateFormFields' && toolContext.updateFormFields) {
            toolContext.updateFormFields(input);
            toolOutput = `Successfully updated fields: ${Object.keys(input).join(', ')}`;
          } else if (name === 'generateJobMaterial' && toolContext.generateJobMaterial) {
            toolContext.generateJobMaterial(input.generationType);
            toolOutput = `Generating ${input.generationType}...`;
          } else {
            toolOutput = { error: `Tool '${name}' not found or implemented.` };
          }
        
          const historyWithToolResponse: CoPilotMessage[] = [
            ...history, // Start from the history before the tool step message
            {
              author: 'tool',
              content: JSON.stringify(toolOutput),
              toolRequestId: toolRequest.id,
            },
          ];
          
          // IMPORTANT: Recursively call runGeneration with the *new* history
          // that includes the tool's output, but not our UX step messages.
          await runGeneration(historyWithToolResponse);

        } else if (response.response) {
          // If no tool was requested, this is the final response.
          // The `history` here is the most up-to-date version.
          setChatHistory([
            ...history,
            { author: 'assistant', content: response.response },
          ]);
        }
      };

      await runGeneration(currentChatHistory);
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
    setToolContext,
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
