'use client';

import { generateBioChatResponse } from '@/ai/flows/generate-bio-chat-response';
import { analyzeBioCompletenessAction } from '@/app/actions';
import { BioProgressTracker } from '@/components/bio-progress-tracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BioChatMessage, BioCompletenessOutput } from '@/lib/schemas';
import { Bot, Copy, Loader2, Send, Trash2, User, AlertTriangle, Save } from 'lucide-react';
import React, { useEffect, useRef, useState, useTransition, useCallback } from 'react';
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
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';

const LOCAL_STORAGE_KEY_BIO_CREATOR_CHAT = 'ai_job_assist_bio_creator_chat_v2';

interface BioCreatorModalProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    initialWorkRepository: string;
    onWorkRepositoryUpdate: (newText: string) => void;
}

export function BioCreatorModal({ isOpen, onOpenChange, initialWorkRepository, onWorkRepositoryUpdate }: BioCreatorModalProps) {
  const [chatHistory, setChatHistory] = useState<BioChatMessage[]>([]);
  const [workRepository, setWorkRepository] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, startGenerating] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [completeness, setCompleteness] = useState<BioCompletenessOutput | null>(null);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getInitialMessage = useCallback((currentText?: string | null): BioChatMessage => {
    if (currentText && currentText.trim().length > 50) {
      return {
        author: 'assistant',
        content: "I've loaded your current work repository. How can I help you improve or expand it?",
        suggestedReplies: ["Check for completeness", "Add a new project", "Optimize for an industry"],
      };
    }
    return {
      author: 'assistant',
      content: "Hello! I'm here to help you build a professional work repository. You can either answer my questions, or just paste your resume or other details and I'll structure it for you.",
      suggestedReplies: ["Paste my resume", "Start with my latest role"],
    };
  }, []);

  const analyzeRepository = useCallback((currentText: string) => {
    if (currentText && currentText.length > 50) {
      startAnalyzing(async () => {
        const result = await analyzeBioCompletenessAction({ workRepository: currentText });
        if ('error' in result) {
          console.error("Analysis failed:", result.error);
        } else {
          setCompleteness(result);
        }
      });
    } else {
      setCompleteness(null);
    }
  }, [startAnalyzing]);

  // Load state from localStorage or props when the modal opens
  useEffect(() => {
    if (isOpen) {
      setWorkRepository(initialWorkRepository);
      try {
        const savedChatData = localStorage.getItem(LOCAL_STORAGE_KEY_BIO_CREATOR_CHAT);
        if (savedChatData) {
          const savedHistory = JSON.parse(savedChatData);
          setChatHistory(savedHistory);
        } else {
          setChatHistory([getInitialMessage(initialWorkRepository)]);
        }
      } catch (e) {
        console.error('Failed to load chat data from localStorage', e);
        setChatHistory([getInitialMessage(initialWorkRepository)]);
      }
      analyzeRepository(initialWorkRepository);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialWorkRepository]);

  // Debounced repository analysis
  useEffect(() => {
    if (!isOpen) return;
    const handler = setTimeout(() => {
      analyzeRepository(workRepository);
    }, 1000); // 1-second debounce

    return () => clearTimeout(handler);
  }, [workRepository, analyzeRepository, isOpen]);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_BIO_CREATOR_CHAT, JSON.stringify(chatHistory));
      } catch (e) {
        console.error('Failed to save chat data to localStorage', e);
      }
    }
  }, [chatHistory, isOpen]);

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

    const newUserMessage: BioChatMessage = { author: 'user', content: message };
    const newChatHistory = [...chatHistory, newUserMessage];
    setChatHistory(newChatHistory);
    setUserInput('');

    startGenerating(async () => {
      const response = await generateBioChatResponse({
        chatHistory: newChatHistory,
        currentWorkRepository: workRepository,
      });

      setChatHistory(prev => [...prev, { author: 'assistant', content: response.response, suggestedReplies: response.suggestedReplies }]);
      setWorkRepository(response.updatedBio);
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
    navigator.clipboard.writeText(workRepository).then(
      () => toast({ title: 'Copied to clipboard!' }),
      () => toast({ variant: 'destructive', title: 'Failed to copy.' })
    );
  };

  const handleStartOver = () => {
    setWorkRepository('');
    const initialMsg = getInitialMessage();
    setChatHistory([initialMsg]);
    setCompleteness(null);
    localStorage.setItem(LOCAL_STORAGE_KEY_BIO_CREATOR_CHAT, JSON.stringify([initialMsg]));
    toast({ title: 'Started Over', description: 'Your repository and chat history have been cleared.' });
  };
  
  const handleSaveChanges = () => {
    onWorkRepositoryUpdate(workRepository);
    onOpenChange(false);
    toast({ title: 'Repository Saved!', description: 'Your updates are now ready in the studio.' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2"><Bot /> AI Work Repository Assistant</DialogTitle>
          <DialogDescription>
            Interactively build your comprehensive professional repository. Your changes will be synced with the main form.
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-2 mt-4">
          {/* Chat Panel */}
          <div className="flex flex-col overflow-hidden bg-muted/30 rounded-2xl border border-muted-foreground/10">
            <div className="flex items-center justify-between p-4 border-b">
                <span className="flex items-center gap-2 font-semibold">
                 <Bot className="h-5 w-5 text-primary" /> AI Assistant
                </span>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Start Over" className='h-8 w-8 text-destructive/80 hover:text-destructive'>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will clear your current repository draft and chat history in this assistant. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStartOver} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Clear Chat & Repo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
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
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                            <Bot size={20} />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${
                            msg.author === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'bg-background text-foreground rounded-tl-none border border-muted-foreground/10'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.author === 'user' && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shadow-inner">
                            <User size={20} />
                          </div>
                        )}
                      </div>
                      {msg.author === 'assistant' && msg.suggestedReplies && msg.suggestedReplies.length > 0 && !isGenerating && (
                         <div className="mt-3 flex flex-wrap gap-2 ml-10">
                            {msg.suggestedReplies.map((reply, i) => (
                                <Button key={i} variant="outline" size="sm" className="rounded-full text-xs hover:bg-primary/5 hover:text-primary hover:border-primary/30" onClick={() => handleSuggestedReplyClick(reply)}>
                                    {reply}
                                </Button>
                            ))}
                         </div>
                      )}
                    </div>
                  ))}
                  {isGenerating && (
                     <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                           <Bot size={20} />
                        </div>
                        <div className="flex items-center space-x-2 rounded-2xl bg-background border border-muted-foreground/10 p-4 text-sm shadow-sm">
                           <Loader2 className="h-4 w-4 animate-spin text-primary" />
                           <span className="text-muted-foreground">Thinking...</span>
                        </div>
                     </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2 mt-2">
                <Textarea
                  ref={inputRef}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message or choose a suggestion..."
                  disabled={isGenerating}
                  rows={1}
                  className="resize-none rounded-xl border-muted-foreground/20 focus-visible:ring-primary shadow-sm"
                />
                <Button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()} size="icon" className="rounded-xl h-11 w-11 shrink-0 bg-primary shadow-lg shadow-primary/20">
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </div>

          {/* Repository Preview Panel */}
          <div className="flex flex-col overflow-hidden bg-muted/30 rounded-2xl border border-muted-foreground/10">
            <div className="flex items-center justify-between p-4 border-b">
                <span className="flex items-center gap-2 font-semibold">
                  <User className="h-5 w-5 text-primary" /> Repository Preview
                </span>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyToClipboard} disabled={!workRepository} aria-label="Copy Content">
                      <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-4 overflow-hidden">
               <BioProgressTracker analysis={completeness} isLoading={isAnalyzing} />
               <Textarea
                value={workRepository}
                onChange={(e) => setWorkRepository(e.target.value)}
                placeholder="Your repository content will appear here..."
                className="flex-1 resize-none bg-background rounded-xl border-muted-foreground/20 p-4 text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Save to Form</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
