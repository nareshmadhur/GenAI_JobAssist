
'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Loader2, Send, Trash2, Wand2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import ReactMarkdown from 'react-markdown';
import { useOnClickOutside } from '@/hooks/use-on-click-outside';

/**
 * The main content of the sidebar, refactored into its own component
 * to be reusable in both the mobile sheet and the desktop sidebar.
 */
function SidebarContentWrapper() {
  const {
    chatHistory,
    setChatHistory,
    handleCoPilotSubmit,
    isGenerating,
    setIsCoPilotSidebarOpen
  } = useAppContext();
  const [userInput, setUserInput] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Auto-scroll chat
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 0);
      }
    }
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    handleCoPilotSubmit(userInput);
    setUserInput('');
  };
  
  const handleClearChat = () => {
      setChatHistory([{
          author: 'assistant',
          content: "Chat cleared! How can I help you with your job application?",
      }]);
      toast({ title: 'Chat Cleared' });
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
      <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Chat</h3>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/80 hover:text-destructive" onClick={handleClearChat}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      {/* Chat Panel */}
      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.map((msg, index) => (
              <div key={index}>
                {msg.type === 'tool-step' ? (
                   <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground my-4">
                        <Wand2 className="h-4 w-4" />
                        <ReactMarkdown className="prose prose-xs dark:prose-invert">{msg.content}</ReactMarkdown>
                    </div>
                ) : (
                  <div
                    className={`flex items-start gap-2 ${
                      msg.author === 'user' ? 'justify-end' : ''
                    }`}
                  >
                    {msg.author === 'assistant' && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot size={16} />
                      </div>
                    )}
                    <div
                      className={`prose prose-sm dark:prose-invert max-w-[90%] rounded-lg p-2.5 text-sm ${
                        msg.author === 'user'
                          ? 'bg-primary text-primary-foreground prose-invert'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content === 'Thinking...' ? (
                        <div className="flex items-center space-x-2 not-prose">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Thinking...</span>
                        </div>
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
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
        <div className="flex items-center gap-2 border-t pt-2">
          <Textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && !e.shiftKey && handleSendMessage()
            }
            placeholder="Ask to edit your bio or generate content..."
            disabled={isGenerating}
            rows={1}
            className="resize-none"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isGenerating || !userInput.trim()}
            size="icon"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * A simple header component for the desktop sidebar that does not rely on Sheet context.
 */
function DesktopSidebarHeader() {
    const { setIsCoPilotSidebarOpen } = useAppContext();
  return (
    <div className="flex items-center justify-between border-b p-4 text-left">
      <div className="flex flex-col">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Bot /> AI Co-pilot
        </h2>
        <p className="text-sm text-muted-foreground">
            Your assistant for the application process.
        </p>
      </div>
       <Button variant="ghost" size="icon" onClick={() => setIsCoPilotSidebarOpen(false)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CoPilotSidebar() {
  const { isCoPilotSidebarOpen, setIsCoPilotSidebarOpen } = useAppContext();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const sidebarRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(sidebarRef, () => {
    if (isCoPilotSidebarOpen && isDesktop) {
        setIsCoPilotSidebarOpen(false);
    }
  });


  // For mobile, use a sheet which provides the necessary context for SheetHeader, etc.
  if (!isDesktop) {
    return (
      <Sheet open={isCoPilotSidebarOpen} onOpenChange={setIsCoPilotSidebarOpen}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-[520px]">
          <SheetHeader className="border-b p-4 text-left">
            <SheetTitle className="flex items-center gap-2">
              <Bot /> AI Co-pilot
            </SheetTitle>
            <SheetDescription>
              Your assistant for the entire application process.
            </SheetDescription>
          </SheetHeader>
          <SidebarContentWrapper />
        </SheetContent>
      </Sheet>
    );
  }

  // For desktop, use a static sidebar and provide a simple, non-contextual header.
  return (
    <aside
      ref={sidebarRef}
      className={cn(
        'fixed right-0 top-0 z-20 flex h-full w-[520px] flex-col border-l bg-card text-card-foreground shadow-lg transition-transform duration-300 ease-in-out',
        isCoPilotSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <DesktopSidebarHeader />
      <SidebarContentWrapper />
    </aside>
  );
}
