'use client';

import React, { useState, useEffect } from 'react';
import type { ControllerRenderProps } from 'react-hook-form';
import { Edit, Eye, Type } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { JobApplicationData } from '@/lib/schemas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExpandableTextareaProps {
  field: ControllerRenderProps<Omit<JobApplicationData, 'generationType'>>;
  label: string;
  placeholder: string;
  footer?: React.ReactNode;
  onAction?: () => Promise<void>;
  isActionLoading?: boolean;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  showTabs?: boolean;
}

/**
 * A component that displays a preview of a text area using Markdown rendering
 * and opens a large dialog for full editing with a Preview mode.
 */
export function ExpandableTextarea({
  field,
  label,
  placeholder,
  footer,
  onAction,
  isActionLoading = false,
  actionLabel = 'AI Action',
  actionIcon,
  showTabs = true,
}: ExpandableTextareaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editedValue, setEditedValue] = useState(field.value || '');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (isOpen) {
      setEditedValue(field.value || '');
      setActiveTab('edit');
    }
  }, [isOpen, field.value]);

  const handleSave = () => {
    field.onChange(editedValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const hasValue = field.value && field.value.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <FormItem className="group">
        <div className="flex items-center justify-between mb-2">
            <FormLabel className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors cursor-pointer">
                {label}
            </FormLabel>
        </div>
        <div className="relative">
            <DialogTrigger asChild>
              <div
                role="button"
                className="prose-preview group/box overflow-hidden cursor-pointer"
              >
                <div className="h-80 w-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    <div className="prose prose-sm max-w-none opacity-80 group-hover/box:opacity-100 transition-opacity pb-2">
                      {hasValue ? (
                          <ReactMarkdown>{field.value}</ReactMarkdown>
                      ) : (
                          <span className="text-muted-foreground/60 italic">{placeholder}</span>
                      )}
                    </div>
                </div>
                <div className="absolute right-3 top-3 flex gap-2 translate-y-1 opacity-0 group-hover/box:translate-y-0 group-hover/box:opacity-100 transition-all pointer-events-none">
                    <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                        <Edit className="h-3.5 w-3.5" />
                    </div>
                </div>
              </div>
            </DialogTrigger>
        </div>
         {footer && <div className="mt-2">{footer}</div>}
        <FormMessage />
      </FormItem>

      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">{label}</DialogTitle>
              <DialogDescription className="mt-1">
                Refine your details below. Use the preview to check formatting.
              </DialogDescription>
            </div>
            {onAction && (
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onAction} 
                    disabled={isActionLoading}
                    className="shrink-0"
                 >
                    {isActionLoading ? <span className="animate-spin mr-2">⏳</span> : actionIcon}
                    {actionLabel}
                </Button>
            )}
          </div>
        </DialogHeader>

        {showTabs ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col mt-4 min-h-0">
                <div className="px-6 border-b">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger 
                            value="edit" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
                        >
                            <Type className="mr-2 h-4 w-4" />
                            Edit Text
                        </TabsTrigger>
                        <TabsTrigger 
                            value="preview" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-medium"
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview Formatting
                        </TabsTrigger>
                    </TabsList>
                </div>
                
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TabsContent value="edit" className="flex-1 min-h-0 m-0 flex flex-col">
                        <Textarea
                            value={editedValue}
                            onChange={(e) => setEditedValue(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 min-h-[450px] w-full resize-none bg-transparent border-none focus-visible:ring-0 p-6 text-base leading-relaxed overflow-y-auto"
                            aria-label={label}
                        />
                    </TabsContent>
                    <TabsContent value="preview" className="flex-1 min-h-0 m-0 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="prose prose-sm max-w-none">
                                {editedValue ? (
                                    <ReactMarkdown>{editedValue}</ReactMarkdown>
                                ) : (
                                    <p className="text-muted-foreground italic text-center mt-20">No content to preview yet.</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        ) : (
            <div className="flex-1 p-6">
                <Textarea
                    value={editedValue}
                    onChange={(e) => setEditedValue(e.target.value)}
                    placeholder={placeholder}
                    className="h-full min-h-[400px] w-full resize-none bg-transparent border-none focus-visible:ring-0 p-0 text-base leading-relaxed"
                    aria-label={label}
                />
            </div>
        )}

        <DialogFooter className="p-6 bg-muted/30 border-t gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="min-w-[100px]">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
