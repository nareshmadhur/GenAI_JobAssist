
'use client';

import { useFormContext } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { JobApplicationData } from '@/lib/schemas';
import { ExpandableTextarea } from '@/components/expandable-textarea';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Wand2, Sparkles, Link as LinkIcon, Loader2, ClipboardPaste, ClipboardCheck, Trash2 } from 'lucide-react';
import { RepositoryAssistantModal } from './repository-assistant-modal';
import { exampleJobDescription, exampleWorkRepository } from '@/lib/example-data';
import { Skeleton } from './ui/skeleton';
import { extractJobDetailsAction, extractUrlTextAction, prettifyWorkRepositoryAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface InputFormProps {
  isInitialLoading: boolean;
}

/**
 * A component that renders the main input form for the application, including
 * text areas for job description and bio.
 *
 * @returns {JSX.Element} The rendered input form.
 */
export function InputForm({ isInitialLoading }: InputFormProps): JSX.Element {
  const formMethods = useFormContext<Omit<JobApplicationData, 'generationType'>>();
  const { watch } = formMethods;
  const [isRepositoryAssistantOpen, setIsRepositoryAssistantOpen] = useState(false);
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const { toast } = useToast();
  
  const jobDescription = watch('jobDescription');
  const workRepository = watch('workRepository');
  const questions = watch('questions');
  
  const [isPrettifying, setIsPrettifying] = useState(false);
  const [isPasting, setIsPasting] = useState<string | null>(null);
  
  // Only show the loader if we're done with the initial load AND the fields are empty.
  const showExampleLoader = !isInitialLoading && !jobDescription && !workRepository;


  const handleLoadExample = () => {
    formMethods.setValue('jobDescription', exampleJobDescription);
    formMethods.setValue('workRepository', exampleWorkRepository);
    formMethods.setValue('questions', '');
  };

  const handleRepositoryUpdate = (newText: string) => {
    formMethods.setValue('workRepository', newText);
  };

  const handlePaste = async (fieldName: keyof Omit<JobApplicationData, 'generationType'>) => {
    try {
      setIsPasting(fieldName);
      const text = await navigator.clipboard.readText();
      if (text) {
        formMethods.setValue(fieldName, text);
        toast({
          title: 'Pasted!',
          description: `Successfully pasted content into ${fieldName === 'workRepository' ? 'Work Repository' : fieldName === 'jobDescription' ? 'Job Description' : 'Questions'}.`,
        });
      }
    } catch (err) {
      toast({
        title: 'Paste Failed',
        description: 'Please ensure you have granted clipboard permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsPasting(null);
    }
  };

  const handlePrettify = async () => {
    const currentText = formMethods.getValues('workRepository').trim();
    if (currentText.length < 20) {
      toast({
        title: 'Too Short',
        description: 'Please provide more details in your repository to prettify.',
        variant: 'destructive',
      });
      return;
    }

    setIsPrettifying(true);
    const result = await prettifyWorkRepositoryAction(currentText);
    setIsPrettifying(false);

    if (result.error) {
      toast({
        title: 'Prettify Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.text) {
      formMethods.setValue('workRepository', result.text);
      toast({
        title: 'Structure Optimized',
        description: 'Your work repository has been professionally structured.',
      });
    }
  };

  const repositoryTriggers = (
    <div className='flex items-center justify-end gap-2'>
        <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => handlePaste('workRepository')}
            disabled={isPasting === 'workRepository'}
            className="-mt-2 text-muted-foreground hover:text-primary"
        >
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste
        </Button>
        <Button 
            type="button" 
            variant="secondary" 
            size="sm" 
            onClick={handlePrettify}
            disabled={isPrettifying}
            className="-mt-2"
        >
            {isPrettifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Prettify & Structure
        </Button>
        <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setIsRepositoryAssistantOpen(true)}
            className="-mt-2"
        >
            <Wand2 className="mr-2 h-4 w-4" />
            AI Assistant
        </Button>
    </div>
  );

  const handleExtractUrl = async () => {
    let url = formMethods.getValues('jobDescription').trim();
    
    if (!url.startsWith('http')) {
      const promptedUrl = window.prompt('Please paste the Job URL here:');
      if (!promptedUrl || !promptedUrl.startsWith('http')) return;
      url = promptedUrl;
    }
    
    setIsExtractingUrl(true);
    const result = await extractUrlTextAction(url);
    setIsExtractingUrl(false);

    if (result.error) {
      toast({
        title: 'Extraction Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.text) {
      formMethods.setValue('jobDescription', result.text);
      toast({
        title: 'Extracted Successfully',
        description: 'The job description has been populated from the URL.',
      });
      // Trigger background question detection after URL extraction
      handleDetectQuestions(result.text);
    }
  };

  const handleDetectQuestions = async (text: string) => {
    if (!text || text.length < 100) return;
    
    const result = await extractJobDetailsAction({ jobDescription: text });
    if (!('error' in result) && result.extractedQuestions && result.extractedQuestions.length > 0) {
      const currentQuestions = formMethods.getValues('questions') || '';
      if (!currentQuestions.trim()) {
        formMethods.setValue('questions', result.extractedQuestions.join('\n\n'));
        toast({
          title: 'Questions Detected',
          description: `Found ${result.extractedQuestions.length} application questions in the description.`,
        });
      }
    }
  };

  const urlExtractorTrigger = (
    <div className='flex items-center justify-end gap-2'>
        <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => handlePaste('jobDescription')}
            disabled={isPasting === 'jobDescription'}
            className="-mt-2 text-muted-foreground hover:text-primary"
        >
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste J.D.
        </Button>
        <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleExtractUrl}
            disabled={isExtractingUrl}
            className="-mt-2"
        >
            {isExtractingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            Extract from URL
        </Button>
    </div>
  );

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Your Information</CardTitle>
              <CardDescription className="prose-sm mt-1.5">
                Provide your info, then choose what to generate from the actions below.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isInitialLoading ? (
            <div className="space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
          ) : showExampleLoader ? (
            <div className="mb-8 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-6 text-center">
                <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                    See the Magic Instantly
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                    New here? Load a pre-filled example to see what AI Job Assist can do for you.
                </p>
                <Button 
                    variant="default"
                    size="sm" 
                    onClick={handleLoadExample} 
                    className="mt-4 animate-ring-pulse"
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Load Example & Get Started
                </Button>
            </div>
          ) : null}

          {!isInitialLoading && (
            <Form {...formMethods}>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-6"
              >
                <FormField
                  control={formMethods.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <ExpandableTextarea
                      field={{
                        ...field,
                        onBlur: () => {
                          field.onBlur();
                          handleDetectQuestions(field.value);
                        }
                      }}
                      label="Job Description"
                      placeholder="Paste the full job description text or a URL here. If pasting a URL, click 'Extract from URL' below."
                      footer={urlExtractorTrigger}
                      onAction={handleExtractUrl}
                      isActionLoading={isExtractingUrl}
                      actionLabel="Extract from URL"
                      actionIcon={<LinkIcon className="mr-2 h-4 w-4" />}
                      showTabs={false}
                    />
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="workRepository"
                  render={({ field }) => (
                    <ExpandableTextarea
                      field={field}
                      label="Work Repository (Experience & Skills)"
                      placeholder="Paste your raw resume or work history here. Click 'Prettify' to let AI structure it professionally."
                      footer={repositoryTriggers}
                      onAction={handlePrettify}
                      isActionLoading={isPrettifying}
                      actionLabel="AI Prettify"
                      actionIcon={<Sparkles className="mr-2 h-4 w-4 text-amber-500" />}
                    />
                  )}
                />
                <FormField
                  control={formMethods.control}
                  name="questions"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Specific Questions (Optional)</FormLabel>
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handlePaste('questions')}
                            disabled={isPasting === 'questions'}
                            className="h-8 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-primary"
                        >
                            <ClipboardPaste className="mr-2 h-3 w-3" />
                            Paste
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Have specific questions? Enter them here, one per line."
                          className="min-h-[100px] rounded-xl border-muted-foreground/20 bg-background/50 focus:bg-background transition-colors"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="prose-sm">
                        Use this to answer specific application questions. If left blank, the AI will scan the J.D. for you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <RepositoryAssistantModal
        isOpen={isRepositoryAssistantOpen}
        onOpenChange={setIsRepositoryAssistantOpen}
        initialWorkRepository={formMethods.getValues('workRepository')}
        onWorkRepositoryUpdate={handleRepositoryUpdate}
      />
    </>
  );
}
