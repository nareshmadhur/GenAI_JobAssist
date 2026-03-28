'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useTransition,
  useRef,
} from 'react';
import type { CoPilotMessage, SavedRepository, SavedJob } from '@/lib/schemas';
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
  updateSavedRepositories,
  updateSavedJobs,
} from '@/lib/firestore-service';

// Defines the shape of the tool context that the main page will provide.
export type ToolContext = {
  getFormFields?: () => Record<string, string>;
  updateFormFields?: (updates: Record<string, string>) => void;
  generateJobMaterial?: (generationType: string) => void;
};

type CoPilotSubmitInput =
  | string
  | {
      message: string;
      displayMessage?: string;
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
  chatHistory: CoPilotMessage[];
  setChatHistory: (history: CoPilotMessage[]) => void;
  isCoPilotSidebarOpen: boolean;
  setIsCoPilotSidebarOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  isGenerating: boolean;
  unreadCoachCount: number;
  markCoachRead: () => void;
  handleCoPilotSubmit: (message: CoPilotSubmitInput) => void;
  setToolContext: (context: ToolContext | null) => void;
  // New state for saved data
  savedJobs: SavedJob[];
  savedRepositories: SavedRepository[];
  setSavedJobs: (jobs: SavedJob[] | ((prev: SavedJob[]) => SavedJob[])) => void;
  setSavedRepositories: (repos: SavedRepository[] | ((prev: SavedRepository[]) => SavedRepository[])) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_COPILOT_CHAT = 'ai_job_assist_copilot_chat';
const LOCAL_STORAGE_KEY_JOBS = 'ai_job_assist_saved_jobs';
const LOCAL_STORAGE_KEY_REPOSITORIES = 'ai_job_assist_saved_repos_v2';

const getFriendlyErrorMessage = (error: any): string => {
    if (!error || !error.message) {
        return 'An unexpected error occurred.';
    }
    const message = error.message;
    if (message.includes('auth/invalid-credential')) {
        return 'Invalid credentials. Please check your email and password.';
    }
    if (message.includes('auth/user-not-found')) {
        return 'No user found with this email.';
    }
     if (message.includes('auth/email-already-in-use')) {
        return 'This email address is already in use.';
    }
    // Fallback for other Firebase errors
    return message.replace(/Firebase: Error \((auth\/[^)]+)\)\.?/, '$1').replace(/-/g, ' ');
};


export function AppProvider({ children }: { children: ReactNode }) {
  // App State
  const [chatHistory, setChatHistory] = useState<CoPilotMessage[]>([]);
  const [isCoPilotSidebarOpen, setIsCoPilotSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, startGenerating] = useTransition();
  const [toolContext, setToolContext] = useState<ToolContext | null>(null);
  const [unreadCoachCount, setUnreadCoachCount] = useState(0);
  const hasInitializedChatRef = useRef(false);
  const previousChatLengthRef = useRef(0);
  
  // New state for saved data, to be synced with Firestore or localStorage
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savedRepositories, setSavedRepositories] = useState<SavedRepository[]>([]);


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

  const handleSetSavedRepositories = (updater: SavedRepository[] | ((prev: SavedRepository[]) => SavedRepository[])) => {
    const newRepos = typeof updater === 'function' ? updater(savedRepositories) : updater;
    setSavedRepositories(newRepos);
    if (user) {
      updateSavedRepositories(user.uid, newRepos);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY_REPOSITORIES, JSON.stringify(newRepos));
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
          const localReposRaw = localStorage.getItem(LOCAL_STORAGE_KEY_REPOSITORIES);
          const localJobs = localJobsRaw ? JSON.parse(localJobsRaw) : [];
          const localRepos = localReposRaw ? JSON.parse(localReposRaw) : [];
          
          const userData = await mergeLocalDataToFirestore(currentUser.uid, localJobs, localRepos);
          
          setSavedJobs(userData.savedJobs);
          setSavedRepositories(userData.savedRepositories || []);

          // Clear local storage after merging to avoid re-merging
          localStorage.removeItem(LOCAL_STORAGE_KEY_JOBS);
          localStorage.removeItem(LOCAL_STORAGE_KEY_REPOSITORIES);

        } catch (error) {
          console.error("Failed to load or merge user data:", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Could not load your saved data.' });
        }
      } else {
        // User is signed out, load data from localStorage
        try {
            const localJobsRaw = localStorage.getItem(LOCAL_STORAGE_KEY_JOBS);
            const localReposRaw = localStorage.getItem(LOCAL_STORAGE_KEY_REPOSITORIES);
            setSavedJobs(localJobsRaw ? JSON.parse(localJobsRaw) : []);
            setSavedRepositories(localReposRaw ? JSON.parse(localReposRaw) : []);
        } catch (error) {
            console.error("Failed to load data from localStorage:", error);
            setSavedJobs([]);
            setSavedRepositories([]);
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
      return { error: getFriendlyErrorMessage(e) };
    }
  };

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      router.push('/');
      return; 
    } catch (e: any) {
      return { error: getFriendlyErrorMessage(e) };
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
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY_COPILOT_CHAT);
      if (savedData) {
        const savedHistory = JSON.parse(savedData);
        if (savedHistory && savedHistory.length > 0) {
          setChatHistory(savedHistory);
        } else {
           setChatHistory([
            {
              author: 'assistant',
              content:
                "Hello! I'm your AI Coach. I can help you with your application. Try asking me to 'improve your work repository' or 'generate a cover letter'.",
            },
          ]);
        }
      } else {
        // Set initial message if no history
        setChatHistory([
          {
            author: 'assistant',
            content:
              "Hello! I'm your AI Coach. I can help you with your application. Try asking me to 'improve your work repository' or 'generate a cover letter'.",
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to load co-pilot chat from localStorage', e);
    }
    setIsLoading(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_COPILOT_CHAT, JSON.stringify(chatHistory));
      } catch (e) {
        console.error('Failed to save co-pilot chat to localStorage', e);
      }
    }
  }, [chatHistory, isLoading]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!hasInitializedChatRef.current) {
      hasInitializedChatRef.current = true;
      previousChatLengthRef.current = chatHistory.length;
      return;
    }

    const newMessages = chatHistory.slice(previousChatLengthRef.current);
    previousChatLengthRef.current = chatHistory.length;

    if (isCoPilotSidebarOpen) {
      return;
    }

    const unreadAdditions = newMessages.filter((message) => message.author === 'assistant').length;
    if (unreadAdditions > 0) {
      setUnreadCoachCount((current) => current + unreadAdditions);
    }
  }, [chatHistory, isCoPilotSidebarOpen, isLoading]);

  useEffect(() => {
    if (isCoPilotSidebarOpen) {
      setUnreadCoachCount(0);
    }
  }, [isCoPilotSidebarOpen]);

  const markCoachRead = () => {
    setUnreadCoachCount(0);
  };

  const handleCoPilotSubmit = (input: CoPilotSubmitInput) => {
    const actualMessage = typeof input === 'string' ? input : input.message;
    const visibleMessage = typeof input === 'string' ? input : (input.displayMessage || input.message);
    const newUserMessage: CoPilotMessage = { author: 'user', content: visibleMessage };
    const currentChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(currentChatHistory);

    startGenerating(async () => {
      // This function will be called recursively if a tool is used.
      const runGeneration = async (history: CoPilotMessage[], enrichedPrompt?: string, rawUserMessage?: string) => {
        const formFields = toolContext?.getFormFields?.();
        const workRepository = formFields?.workRepository || '';
        const jobDescription = formFields?.jobDescription || '';

        let finalEnrichedPrompt = enrichedPrompt;
        
        // Step 1: Enrich the prompt (if not already done in a recursive call)
        if (!finalEnrichedPrompt) {
            const enrichmentResponse = await enrichCopilotPrompt({
                chatHistory: rawUserMessage
                  ? [...history.slice(0, -1), { author: 'user', content: rawUserMessage }]
                  : history,
                jobDescription,
                workRepository,
            });

            if (enrichmentResponse.error) {
                setChatHistory(prev => [...prev, { author: 'assistant', content: enrichmentResponse.error! }]);
                return;
            }

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

        if (response.error) {
            setChatHistory(prev => [...prev, { author: 'assistant', content: response.error! }]);
            return;
        }

        // Check if the AI requested a tool.
        if (response.toolRequest) {
          const toolRequest = response.toolRequest as ToolRequestPart;
          const requestedTool = toolRequest.toolRequest;
          let toolOutput: any = null;
          const name = requestedTool.name;
          const input = (requestedTool.input || {}) as Record<string, any>;

          // Add any text the model generated before the tool request as a new message.
          if (response.response) {
            setChatHistory(prev => [...prev, { author: 'assistant', content: response.response! }]);
          }
          
          // Execute the requested tool on the client-side.
          if (!toolContext) {
            const blockedMessage =
              "I can help with advice here, but to edit fields or generate materials please open Build Your Application.";
            setChatHistory(prev => [...prev, { author: 'assistant', content: blockedMessage }]);
            toolOutput = { error: 'Build Your Application context is not available on this page.' };
          } else if (name === 'updateFormFields' && toolContext.updateFormFields) {
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
              toolRequestId: requestedTool.ref,
            },
          ];
          
          await runGeneration(historyWithToolResponse, finalEnrichedPrompt, rawUserMessage);

        } else if (response.response) {
            // Add the final response as a new message.
            setChatHistory(prev => [...prev, { author: 'assistant', content: response.response! }]);
        } else {
            // If there's no response, do nothing (the thinking message is already there).
        }
      };

      await runGeneration(currentChatHistory, undefined, actualMessage);
    });
  };

  const appContextValue = {
    chatHistory,
    setChatHistory,
    isCoPilotSidebarOpen,
    setIsCoPilotSidebarOpen,
    isLoading,
    setIsLoading,
    isGenerating,
    unreadCoachCount,
    markCoachRead,
    handleCoPilotSubmit,
    setToolContext,
    savedJobs,
    savedRepositories,
    setSavedJobs: handleSetSavedJobs,
    setSavedRepositories: handleSetSavedRepositories,
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
