
'use client';

import { generateBioChatResponse } from '@/ai/flows/generate-bio-chat-response';
import { analyzeBioCompletenessAction } from '@/app/actions';
import { BioProgressTracker } from '@/components/bio-progress-tracker';
import { JobSparkLogo } from '@/components/job-spark-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BioChatMessage, BioCompletenessOutput, SavedBio } from '@/lib/schemas';
import { Bot, Copy, ExternalLink, Loader2, Send, Trash2, User, AlertTriangle, List, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState, useTransition, useCallback, Suspense } from 'react';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SavedBiosSheet } from '@/components/saved-bios-sheet';


const LOCAL_STORAGE_KEY_JOB_MATCHER_FORM = 'jobspark_form_data';
const LOCAL_STORAGE_KEY_SAVED_BIOS = 'jobspark_saved_bios';
const LOCAL_STORAGE_KEY_CHAT = 'jobspark_bio_creator_chat';


function BioCreatorCore() {
  const [chatHistory, setChatHistory] = useState<BioChatMessage[]>([]);
  const [bio, setBio] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, startGenerating] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [completeness, setCompleteness] = useState<BioCompletenessOutput | null>(null);
  const [savedBios, setSavedBios] = useState<SavedBio[]>([]);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [bioNameToSave, setBioNameToSave] = useState('');

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const getInitialMessage = useCallback((initialBio?: string | null): BioChatMessage => {
    if (initialBio && initialBio.trim().length > 50) {
      return {
        author: 'assistant',
        content: "I've loaded the bio you were working on. How can I help you improve it?",
        suggestedReplies: ["Check for completeness", "Make it more professional", "Shorten this section"],
      };
    }
    return {
      author: 'assistant',
      content: "Hello! I'm here to help you build a professional bio. You can either answer my questions, or just paste your resume or other details and I'll structure it for you.",
      suggestedReplies: ["Add my name", "Paste my resume"],
    };
  }, []);
  
  const analyzeBio = useCallback((currentBio: string) => {
    if (currentBio && currentBio.length > 50) {
      startAnalyzing(async () => {
        const result = await analyzeBioCompletenessAction({ bio: currentBio });
        if (result.success) {
          setCompleteness(result.data);
        } else {
          console.error("Bio analysis failed:", result.error);
        }
      });
    } else {
      setCompleteness(null);
    }
  }, [startAnalyzing]);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      // Load saved bios list
      const savedBiosData = localStorage.getItem(LOCAL_STORAGE_KEY_SAVED_BIOS);
      if (savedBiosData) {
        setSavedBios(JSON.parse(savedBiosData));
      }

      const savedChatData = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT);

      if (savedChatData) {
        const { bio: savedBio, history: savedHistory } = JSON.parse(savedChatData);
        setBio(savedBio || '');
        setChatHistory(savedHistory || [getInitialMessage(savedBio)]);
        analyzeBio(savedBio);
      } else {
         // If coming from matcher, load the bio from the matcher's form data
        const fromMatcher = searchParams.get('from') === 'matcher';
        let initialBio = '';

        if (fromMatcher) {
          const matcherDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY_JOB_MATCHER_FORM);
          if (matcherDataRaw) {
            initialBio = JSON.parse(matcherDataRaw).bio || '';
          }
        }
        setBio(initialBio);
        setChatHistory([getInitialMessage(initialBio)]);
        analyzeBio(initialBio);
      }

    } catch (e) {
      console.error('Failed to load data from localStorage', e);
      setChatHistory([getInitialMessage()]);
    }
  }, [getInitialMessage, searchParams, analyzeBio]);


  // Debounced bio analysis
  useEffect(() => {
    const handler = setTimeout(() => {
      analyzeBio(bio);
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
    };
  }, [bio, analyzeBio]);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const dataToSave = {
        bio: bio,
        history: chatHistory,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_CHAT, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save chat data to localStorage', e);
    }
  }, [bio, chatHistory]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
             setTimeout(() => {
                viewport.scrollTop = viewport.scrollHeight;
            }, 0);
        }
    }
  }, [chatHistory]);
  
  const sendMessage = (message: string) => {
    if (!message.trim()) return;

    if (message.toLowerCase() === "go to job matcher") {
        handleUseBio();
        return;
    }

    const newUserMessage: BioChatMessage = { author: 'user', content: message };
    const newChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(newChatHistory);
    setUserInput('');

    startGenerating(async () => {
      const response = await generateBioChatResponse({
        chatHistory: newChatHistory,
        currentBio: bio,
      });

      if (response.error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: response.error,
        });
        setChatHistory(chatHistory);
      } else {
        setChatHistory(prev => [...prev, { author: 'assistant', content: response.response, suggestedReplies: response.suggestedReplies }]);
        setBio(response.updatedBio);
      }
    });
  };

  const handleSuggestedReplyClick = (reply: string) => {
    setUserInput(reply + ': ');
    inputRef.current?.focus();
  };
  
  const handleSendMessage = () => {
    sendMessage(userInput);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(bio).then(
      () => {
        toast({ title: 'Bio copied to clipboard!' });
      },
      () => {
        toast({ variant: 'destructive', title: 'Failed to copy bio.' });
      }
    );
  };
  
  const handleUseBio = () => {
    if (!bio) {
        toast({ variant: 'destructive', title: 'Your bio is empty.' });
        return;
    }
     try {
      // Get existing matcher data, or create a new object.
      const existingDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY_JOB_MATCHER_FORM);
      const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
      
      // Update the bio, keep other fields like jobDescription, and clear any old results.
      const dataToSave = { 
          ...existingData, 
          bio: bio, 
          allResults: {},
        };

      localStorage.setItem(LOCAL_STORAGE_KEY_JOB_MATCHER_FORM, JSON.stringify(dataToSave));
      toast({ title: 'Bio Ready!', description: 'Redirecting you to the Job Matcher...' });
      router.push('/job-matcher');
    } catch (e) {
      console.error('Failed to save bio for Job Matcher', e);
      toast({ variant: 'destructive', title: 'Could not load bio for Job Matcher.' });
    }
  }

  const handleStartOver = () => {
    setBio('');
    setChatHistory([getInitialMessage()]);
    setCompleteness(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CHAT);
    toast({ title: 'Started Over', description: 'Your bio and chat history have been cleared.' });
  };

  const handleSaveBio = () => {
    if (!bioNameToSave.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a name for the bio.' });
      return;
    }

    const newSavedBio: SavedBio = {
      id: crypto.randomUUID(),
      name: bioNameToSave,
      bio: bio,
      savedAt: new Date().toISOString(),
    };

    const updatedSavedBios = [...savedBios, newSavedBio];
    setSavedBios(updatedSavedBios);
    localStorage.setItem(LOCAL_STORAGE_KEY_SAVED_BIOS, JSON.stringify(updatedSavedBios));

    toast({ title: 'Bio Saved!', description: `"${newSavedBio.name}" has been saved.` });
    setIsSaveDialogOpen(false);
    setBioNameToSave('');
  };
  
  const handleLoadBio = (savedBio: SavedBio) => {
    setBio(savedBio.bio);
    setChatHistory([getInitialMessage(savedBio.bio)]);
    toast({ title: 'Bio Loaded', description: `Loaded "${savedBio.name}".` });
  };

  const handleDeleteBio = (bioId: string) => {
    const updatedSavedBios = savedBios.filter((b) => b.id !== bioId);
    setSavedBios(updatedSavedBios);
    localStorage.setItem(LOCAL_STORAGE_KEY_SAVED_BIOS, JSON.stringify(updatedSavedBios));
    toast({ title: 'Bio Deleted' });
  };


  const isBioNearlyComplete = completeness ? Object.values(completeness).filter(Boolean).length >= 4 : false;


  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 w-full border-b border-b-accent bg-primary px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
             <Link href="/" aria-label="Back to Home">
                <JobSparkLogo className="h-10 w-10 text-primary-foreground" />
            </Link>
            <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                JobSpark
              </h1>
              <div className="text-xs text-primary-foreground/80">
                AI Bio Creator
              </div>
            </div>
          </div>
           <div className="flex items-center gap-2">
            <SavedBiosSheet
              savedBios={savedBios}
              onLoadBio={handleLoadBio}
              onDeleteBio={handleDeleteBio}
            />
             <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={!bio} aria-label="Save Bio">
                        <Save className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Your Bio</DialogTitle>
                        <DialogDescription>
                            Give this version of your bio a name so you can easily find it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bio-name" className="text-right">Name</Label>
                            <Input
                                id="bio-name"
                                value={bioNameToSave}
                                onChange={(e) => setBioNameToSave(e.target.value)}
                                className="col-span-3"
                                placeholder={`Bio for a ${completeness?.hasWorkExperience ? 'Developer' : 'New Role'}`}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" onClick={handleSaveBio}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Start Over">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className='flex items-center gap-2'>
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Are you sure you want to start over?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently clear your current bio and chat history. This action cannot be undone. Saved named bios will not be affected.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartOver} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Start Over
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <ThemeToggleButton />
           </div>
        </div>
      </header>
      <main className="flex-1 p-4">
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden md:grid-cols-2">
          {/* Chat Panel */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
              <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div key={index}>
                      <div
                        className={`flex items-start gap-3 ${
                          msg.author === 'user' ? 'justify-end' : ''
                        }`}
                      >
                        {msg.author === 'assistant' && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Bot size={20} />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg p-3 text-sm ${
                            msg.author === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.author === 'user' && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      {msg.author === 'assistant' && msg.suggestedReplies && msg.suggestedReplies.length > 0 && !isGenerating && (
                         <div className="mt-2 flex flex-wrap gap-2">
                            {msg.suggestedReplies.map((reply, i) => (
                                <Button key={i} variant="outline" size="sm" onClick={() => handleSuggestedReplyClick(reply)}>
                                    {reply}
                                </Button>
                            ))}
                         </div>
                      )}
                    </div>
                  ))}
                  {isGenerating && (
                     <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                           <Bot size={20} />
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg bg-muted p-3 text-sm">
                           <Loader2 className="h-5 w-5 animate-spin" />
                           <span>Thinking...</span>
                        </div>
                     </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2">
                <Textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message or choose a suggestion..."
                  disabled={isGenerating}
                  rows={1}
                  className="resize-none"
                />
                <Button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()}>
                  <Send size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bio Preview Panel */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User /> Your Bio
                </span>
                <div>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} disabled={!bio} aria-label="Copy Bio">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={!bio}
                        className={cn(isBioNearlyComplete && 'animate-ring-pulse ring-2 ring-accent')}
                        onClick={handleUseBio}
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Use Bio
                    </Button>
                </div>
              </CardTitle>
              <BioProgressTracker analysis={completeness} isLoading={isAnalyzing} />
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your bio will appear here as you build it..."
                className="flex-1 resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function BioCreatorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <BioCreatorCore />
        </Suspense>
    )
}
