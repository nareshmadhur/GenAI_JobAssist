
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
    initialBio: string;
    onBioUpdate: (newBio: string) => void;
}

export function BioCreatorModal({ isOpen, onOpenChange, initialBio, onBioUpdate }: BioCreatorModalProps) {
  const [chatHistory, setChatHistory] = useState<BioChatMessage[]>([]);
  const [bio, setBio] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, startGenerating] = useTransition();
  const [isAnalyzing, startAnalyzing] = useTransition();
  const [completeness, setCompleteness] = useState<BioCompletenessOutput | null>(null);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const getInitialMessage = useCallback((currentBio?: string | null): BioChatMessage => {
    if (currentBio && currentBio.trim().length > 50) {
      return {
        author: 'assistant',
        content: "I've loaded your current bio. How can I help you improve it?",
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
      setBio(initialBio);
      try {
        const savedChatData = localStorage.getItem(LOCAL_STORAGE_KEY_BIO_CREATOR_CHAT);
        if (savedChatData) {
          const savedHistory = JSON.parse(savedChatData);
          setChatHistory(savedHistory);
        } else {
          setChatHistory([getInitialMessage(initialBio)]);
        }
      } catch (e) {
        console.error('Failed to load chat data from localStorage', e);
        setChatHistory([getInitialMessage(initialBio)]);
      }
      analyzeBio(initialBio);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialBio]);

  // Debounced bio analysis
  useEffect(() => {
    if (!isOpen) return;
    const handler = setTimeout(() => {
      analyzeBio(bio);
    }, 1000); // 1-second debounce

    return () => clearTimeout(handler);
  }, [bio, analyzeBio, isOpen]);

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
        currentBio: bio,
      });

      setChatHistory(prev => [...prev, { author: 'assistant', content: response.response, suggestedReplies: response.suggestedReplies }]);
      setBio(response.updatedBio);
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
      () => toast({ title: 'Bio copied to clipboard!' }),
      () => toast({ variant: 'destructive', title: 'Failed to copy bio.' })
    );
  };

  const handleStartOver = () => {
    setBio('');
    const initialMsg = getInitialMessage();
    setChatHistory([initialMsg]);
    setCompleteness(null);
    localStorage.setItem(LOCAL_STORAGE_KEY_BIO_CREATOR_CHAT, JSON.stringify([initialMsg]));
    toast({ title: 'Started Over', description: 'Your bio and chat history have been cleared.' });
  };
  
  const handleSaveChanges = () => {
    onBioUpdate(bio);
    onOpenChange(false);
    toast({ title: 'Bio Updated!', description: 'Your changes have been saved to the main form.' });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2"><Bot /> AI Bio Assistant</DialogTitle>
          <DialogDescription>
            Use this interactive assistant to build a comprehensive professional bio. Your changes will be saved to the main form when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2">
          {/* Chat Panel */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                 <Bot /> AI Assistant
                </span>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Start Over" className='text-destructive/80 hover:text-destructive'>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will clear your current bio draft and chat history in this assistant. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleStartOver} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Clear Chat & Bio
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
                  <User /> Your Bio Draft
                </span>
                <div>
                    <Button variant="ghost" size="icon" onClick={handleCopyToClipboard} disabled={!bio} aria-label="Copy Bio">
                      <Copy className="h-4 w-4" />
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
        <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Save to Form</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
