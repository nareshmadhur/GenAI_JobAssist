
'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  User,
  Loader2,
  Send,
  Contact,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { generateBioChatResponse } from '@/ai/flows/generate-bio-chat-response';
import type { BioChatMessage, BioCompletenessOutput } from '@/lib/schemas';
import { analyzeBioCompletenessAction } from '@/app/actions';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';

const checklistItems = [
  {
    key: 'hasContactInfo',
    label: 'Contact',
    icon: <Contact className="h-5 w-5" />,
  },
  { key: 'hasSummary', label: 'Summary', icon: <FileText className="h-5 w-5" /> },
  {
    key: 'hasWorkExperience',
    label: 'Experience',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    key: 'hasEducation',
    label: 'Education',
    icon: <GraduationCap className="h-5 w-5" />,
  },
  { key: 'hasSkills', label: 'Skills', icon: <Wrench className="h-5 w-5" /> },
];

function BioProgressTracker({
  analysis,
  isLoading,
}: {
  analysis: BioCompletenessOutput | null;
  isLoading: boolean;
}) {
  const completedCount = analysis
    ? Object.values(analysis).filter(Boolean).length
    : 0;
  const totalCount = checklistItems.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3 rounded-lg border bg-background/50 p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Bio Completeness</h4>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {completedCount} / {totalCount}
          </span>
        )}
      </div>
      <Progress value={progressPercentage} className="h-1.5" />
      <div className="grid grid-cols-5 gap-1 text-center">
        <TooltipProvider>
          {checklistItems.map((item) => {
            const isCompleted = analysis?.[item.key as keyof BioCompletenessOutput] ?? false;
            return (
              <Tooltip key={item.key} delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'relative flex h-7 w-7 items-center justify-center rounded-full',
                        isCompleted
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {React.cloneElement(item.icon, { className: 'h-4 w-4'})}
                       {isCompleted && (
                        <CheckCircle2 className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-background text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}

/**
 * The main content of the sidebar, refactored into its own component
 * to be reusable in both the mobile sheet and the desktop sidebar.
 */
function SidebarContentWrapper() {
    const {
        bio,
        setBio,
        chatHistory,
        setChatHistory,
    } = useAppContext();
    const [userInput, setUserInput] = useState('');
    const [isGenerating, startGenerating] = useTransition();
    const [isAnalyzing, startAnalyzing] = useTransition();
    const [completeness, setCompleteness] = useState<BioCompletenessOutput | null>(null);

    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    
    // Analyze bio completeness (debounced)
    useEffect(() => {
        const handler = setTimeout(() => {
        if (bio && bio.length > 50) {
            startAnalyzing(async () => {
            const result = await analyzeBioCompletenessAction({ bio });
            if (result.success) {
                setCompleteness(result.data);
            } else {
                console.error('Bio analysis failed:', result.error);
            }
            });
        } else {
            setCompleteness(null);
        }
        }, 1000);

        return () => clearTimeout(handler);
    }, [bio, startAnalyzing]);

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

    const handleSendMessage = () => sendMessage(userInput);
    const handleSuggestedReplyClick = (reply: string) => setUserInput(reply + ': ');
    const handleClearBio = () => {
        setBio('');
        setChatHistory([{
            author: 'assistant',
            content: "Bio cleared! How can I help you start a new one?",
            suggestedReplies: ["Add my name", "Paste my resume"],
        }]);
        toast({ title: 'Bio Cleared' });
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden p-4 gap-4">
            {/* Bio Preview Panel */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Your Bio</h3>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={handleClearBio}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Your bio will appear here as you build it..."
                    className="flex-1 resize-none h-32 text-xs"
                />
                <BioProgressTracker analysis={completeness} isLoading={isAnalyzing} />
            </div>

            {/* Chat Panel */}
            <div className="flex flex-col flex-1 gap-2 overflow-hidden border-t pt-4">
                <h3 className="font-semibold text-sm">Chat</h3>
                <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                        {chatHistory.map((msg, index) => (
                            <div key={index}>
                                <div
                                    className={`flex items-start gap-2 ${
                                    msg.author === 'user' ? 'justify-end' : ''
                                    }`}
                                >
                                    {msg.author === 'assistant' && (
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                                        <Bot size={16} />
                                    </div>
                                    )}
                                    <div
                                    className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                                        msg.author === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                                    >
                                    {msg.content}
                                    </div>
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
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Bot size={16} />
                                </div>
                                <div className="flex items-center space-x-2 rounded-lg bg-muted p-3 text-sm">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="flex items-center gap-2 pt-2 border-t">
                    <Textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Ask a question or paste text..."
                        disabled={isGenerating}
                        rows={1}
                        className="resize-none"
                    />
                    <Button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()} size="icon">
                        <Send size={18} />
                    </Button>
                </div>
            </div>
        </div>
    )
}

/**
 * A simple header component for the desktop sidebar that does not rely on Sheet context.
 */
function DesktopSidebarHeader() {
    return (
         <div className="p-4 border-b text-left">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Bot /> AI Co-pilot</h2>
            <p className="text-sm text-muted-foreground">
                Your assistant for crafting the perfect professional bio.
            </p>
        </div>
    )
}


export function CoPilotSidebar() {
  const { isCoPilotSidebarOpen, setIsCoPilotSidebarOpen } = useAppContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // For mobile, use a sheet which provides the necessary context for SheetHeader, etc.
  if (!isDesktop) {
      return (
        <Sheet open={isCoPilotSidebarOpen} onOpenChange={setIsCoPilotSidebarOpen}>
            <SheetContent className="w-full p-0 sm:max-w-md flex flex-col">
                 <SheetHeader className="p-4 border-b text-left">
                    <SheetTitle className="flex items-center gap-2"><Bot /> AI Co-pilot</SheetTitle>
                    <SheetDescription>
                        Your assistant for crafting the perfect professional bio.
                    </SheetDescription>
                </SheetHeader>
                <SidebarContentWrapper />
            </SheetContent>
        </Sheet>
      );
  }

  // For desktop, use a static sidebar and provide a simple, non-contextual header.
  return (
    <aside className={cn("fixed top-0 right-0 z-20 h-full w-96 border-l bg-card text-card-foreground shadow-lg transition-transform duration-300 ease-in-out flex flex-col", 
        isCoPilotSidebarOpen ? "translate-x-0" : "translate-x-full"
    )}>
       <DesktopSidebarHeader />
       <SidebarContentWrapper />
    </aside>
  );
}
