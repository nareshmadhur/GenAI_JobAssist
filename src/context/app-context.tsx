
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useTransition,
  useCallback,
} from 'react';
import type { CoPilotMessage, SavedBio, SavedJob } from '@/lib/schemas';
import { generateCoPilotResponse } from '@/ai/flows/generate-co-pilot-response';
import { enrichCopilotPrompt } from '@/ai/flows/enrich-copilot-prompt';
import { useToast } from '@/hooks/use-toast';
import type { ToolRequestPart } from 'genkit';
import { auth } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    type User 
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  getUserData,
  mergeLocalDataToFirestore,
  updateSavedBios,
  updateSavedJobs,
} from '@/lib/firestore-service';

// Defines the shape of the tool context that the main page will provide.
export type ToolContext = {
  getFormFields?: () => Record<string, string>;
  updateFormFields?: (updates: Record<string, string>) => void;
  generateJobMaterial?: (generationType: string) => void;
};


interface AuthContextType {
  user: User | null;
  authLoading: boolean;
  signup: (email: string, pass: string) => Promise<{ error?: string } | void>;
  login: (email: string, pass: string) => Promise<{ error?: string } | void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  // New state for saved data
  savedJobs: SavedJob[];
  savedBios: SavedBio[];
  setSavedJobs: (jobs: SavedJob[] | ((prev: SavedJob[]) => SavedJob[])) => void;
  setSavedBios: (bios: SavedBio[] | ((prev: SavedBio[]) => SavedBio[])) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_APP = 'jobspark_app_data';
const LOCAL_STORAGE_KEY_JOBS = 'jobspark_saved_jobs';
const LOCAL_STORAGE_KEY_BIOS = 'jobspark_saved_bios';

export function AppProvider({ children }: { children: ReactNode }) {
  // App State
  const [bio, setBio] = useState('');
  const [chatHistory, setChatHistory] = useState<CoPilotMessage[]>([]);
  const [isCoPilotSidebarOpen, setIsCoPilotSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, startGenerating] = useTransition();
  const [toolContext, setToolContext] = useState<ToolContext | null>(null);
  
  // New state for saved data, to be synced with Firestore or localStorage
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedBios, setSavedBios] = useState<SavedBio[]>([]);


  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const router = useRouter();
  const { toast } = useToast();

  const handleSetSavedJobs = (updater: SavedJob[] | ((prev: SavedJob[]) => SavedJob[])) => {
    const newJobs = typeof updater === 'function' ? updater(savedJobs) : updater;
    setSavedJobs(newJobs);
    if (user) {
      updateSavedJobs(user.uid, newJobs);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_JOBS, JSON.stringify(newJobs));
    }
  };

  const handleSetSavedBios = (updater: SavedBio[] | ((prev: SavedBio[]) => SavedBio[])) => {
    const newBios = typeof updater === 'function' ? updater(savedBios) : updater;
    setSavedBios(newBios);
    if (user) {
      updateSavedBios(user.uid, newBios);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_BIOS, JSON.stringify(newBios));
    }
  };

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // User is signed in, load/merge data from Firestore
        try {
          const localJobsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_JOBS);
          const localBiosRaw = localStorage.getItem(LOCAL_STORAGE_KEY_BIOS);
          const localJobs = localJobsRaw ? JSON.parse(localJobsRaw) : [];
          const localBios = localBiosRaw ? JSON.parse(localBiosRaw) : [];
          
          const userData = await mergeLocalDataToFirestore(currentUser.uid, localJobs, localBios);
          
          setSavedJobs(userData.savedJobs);
          setSavedBios(userData.savedBios);

          // Clear local storage after merging to avoid re-merging
          localStorage.removeItem(LOCAL_STORAGE_KEY_JOBS);
          localStorage.removeItem(LOCAL_STORAGE_KEY_BIOS);

        } catch (error) {
          console.error("Failed to load or merge user data:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load your saved data.' });
        }
      } else {
        // User is signed out, load data from localStorage
        try {
            const localJobsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_JOBS);
            const localBiosRaw = localStorage.getItem(LOCAL_STORAGE_KEY_BIOS);
            setSavedJobs(localJobsRaw ? JSON.parse(localJobsRaw) : []);
            setSavedBios(localBiosRaw ? JSON.parse(localBiosRaw) : []);
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
            setSavedJobs([]);
            setSavedBios([]);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signup = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged will handle data merging and auth state
      toast({
        title: 'Welcome!',
        description: 'Your account has been created successfully.',
      });
      router.push('/');
    } catch (e: any) {
      console.error("Signup Error:", e.message); // Debugging log
      return { error: e.message };
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return; // Explicitly return nothing on success
    } catch (e: any) {
      console.error("Login Error:", e.message); // Debugging log
      return { error: e.message }; // Return the error object on failure
    }
  };
  

  const logout = () => {
    signOut(auth);
    router.push('/');
  };


  // App Logic
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
      const runGeneration = async (history: CoPilotMessage[], enrichedPrompt?: string) => {
        if (!toolContext?.getFormFields) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Form context is not available. Cannot submit.',
          });
          return;
        }
        const { bio, jobDescription } = toolContext.getFormFields();

        let finalEnrichedPrompt = enrichedPrompt;
        
        // Step 1: Enrich the prompt (if not already done in a recursive call)
        if (!finalEnrichedPrompt) {
            const enrichmentResponse = await enrichCopilotPrompt({
                chatHistory: history,
                jobDescription,
                bio,
            });

            finalEnrichedPrompt = enrichmentResponse.enrichedPrompt;
            const thinkingMessage: CoPilotMessage = {
                author: 'assistant',
                type: 'tool-step',
                content: enrichmentResponse.thinkingMessage,
            };
            // Show the "thinking" message immediately and persistently.
            setChatHistory(prev => [...prev, thinkingMessage]);
        }
        
        // Step 2: Generate the final response using the enriched prompt
        const response = await generateCoPilotResponse({
          enrichedPrompt: finalEnrichedPrompt!,
        });

        // Check if the AI requested a tool.
        if (response.toolRequest) {
          const toolRequest = response.toolRequest as ToolRequestPart;
          let toolOutput: any = null;
          
          const { name, input } = toolRequest;

          // Add any text the model generated before the tool request as a new message.
          if (response.response) {
            setChatHistory(prev => [...prev, { author: 'assistant', content: response.response! }]);
          }
          
          // Execute the requested tool on the client-side.
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
            ...history,
            {
              author: 'tool',
              content: JSON.stringify(toolOutput),
              toolRequestId: toolRequest.id,
            },
          ];
          
          await runGeneration(historyWithToolResponse, finalEnrichedPrompt);

        } else if (response.response) {
            // Add the final response as a new message.
            setChatHistory(prev => [...prev, { author: 'assistant', content: response.response! }]);
        } else {
            // If there's no response, do nothing (the thinking message is already there).
        }
      };

      await runGeneration(currentChatHistory);
    });
  };

  const appContextValue = {
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
    savedJobs,
    savedBios,
    setSavedJobs: handleSetSavedJobs,
    setSavedBios: handleSetSavedBios,
  };
  
  const authContextValue = {
      user,
      authLoading,
      signup,
      login,
      logout
  }

  return (
    <AppContext.Provider value={appContextValue}>
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AppProvider');
  }
  return context;
}
