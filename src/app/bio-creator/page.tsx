
'use client';

import { generateBioChatResponse } from '@/ai/flows/generate-bio-chat-response';
import { JobSparkLogo } from '@/components/job-spark-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { BioChatMessage } from '@/lib/schemas';
import { Bot, Copy, ExternalLink, Loader2, Send, Trash2, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState, useTransition } from 'react';
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

const LOCAL_STORAGE_KEY_BIO_FORM = 'jobspark_form_data';
const LOCAL_STORAGE_KEY_BIO = 'jobspark_bio_creator_bio';
const LOCAL_STORAGE_KEY_CHAT = 'jobspark_bio_creator_chat';

const INITIAL_MESSAGE: BioChatMessage = {
  author: 'assistant',
  content: "Hello! I'm here to help you build a professional bio. You can either answer my questions one by one, or simply paste your existing resume, notes, or any other details, and I'll structure it for you.\n\nTo start, what is your full name and most recent job title?",
};

export default function BioCreatorPage() {
  const [chatHistory, setChatHistory] = useState<BioChatMessage[]>([INITIAL_MESSAGE]);
  const [bio, setBio] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedBio = localStorage.getItem(LOCAL_STORAGE_KEY_BIO);
      if (savedBio) setBio(JSON.parse(savedBio));

      const savedChat = localStorage.getItem(LOCAL_STORAGE_KEY_CHAT);
      if (savedChat) {
        const parsedChat = JSON.parse(savedChat);
        if (parsedChat.length > 0) {
          setChatHistory(parsedChat);
        }
      }
    } catch (e) {
      console.error('Failed to load data from localStorage', e);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_BIO, JSON.stringify(bio));
      localStorage.setItem(LOCAL_STORAGE_KEY_CHAT, JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save data to localStorage', e);
    }
  }, [bio, chatHistory]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);
  
  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const newUserMessage: BioChatMessage = { author: 'user', content: userInput };
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
        // Optionally remove the user's message if the API call fails
        setChatHistory(chatHistory);
      } else {
        setChatHistory(prev => [...prev, { author: 'assistant', content: response.response }]);
        setBio(response.updatedBio);
      }
    });
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
        const existingDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY_BIO_FORM);
        const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
        const dataToSave = { ...existingData, bio };
        localStorage.setItem(LOCAL_STORAGE_KEY_BIO_FORM, JSON.stringify(dataToSave));
        toast({ title: 'Bio saved!', description: 'Redirecting you to the Job Matcher...' });
        router.push('/job-matcher');
    } catch (e) {
        console.error('Failed to save bio for Job Matcher', e);
        toast({ variant: 'destructive', title: 'Could not save bio.' });
    }
  }

  const handleStartOver = () => {
    setBio('');
    setChatHistory([INITIAL_MESSAGE]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_BIO);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CHAT);
    toast({ title: 'Started Over', description: 'Your bio and chat history have been cleared.' });
  };


  return (
    <div className="flex h-screen flex-col bg-muted/20">
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
                        This will permanently clear your current bio and chat history. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartOver}>
                        Start Over
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
             <ThemeToggleButton />
           </div>
        </div>
      </header>
      <main className="flex flex-1 flex-col overflow-hidden p-4">
        <div className="flex-1 grid grid-cols-1 gap-4 overflow-hidden md:grid-cols-2">
          {/* Chat Panel */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot /> AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
              <ScrollArea className="flex-1 pr-4" ref={chatContainerRef}>
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
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
                  ))}
                  {isGenerating && (
                     <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                           <Bot size={20} />
                        </div>
                        <div className="flex items-center space-x-2 rounded-lg bg-muted p-3">
                           <Loader2 className="h-5 w-5 animate-spin" />
                           <span>Thinking...</span>
                        </div>
                     </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message..."
                  disabled={isGenerating}
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
                    <Button variant="outline" size="sm" onClick={handleUseBio} disabled={!bio}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Use Bio
                    </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your bio will appear here as you build it..."
                className="h-full flex-1 resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
