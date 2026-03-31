
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
import { Input } from './ui/input';

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
  const [jobUrl, setJobUrl] = useState('');
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
    <div className='flex flex-wrap items-center justify-start gap-2 sm:justify-end'>
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
    const pastedJobDescription = formMethods.getValues('jobDescription').trim();
    const candidateUrl = jobUrl.trim() || (pastedJobDescription.startsWith('http') ? pastedJobDescription : '');

    if (!candidateUrl.startsWith('http')) {
      toast({
        title: 'Add a job posting link first',
        description: 'Paste the job URL into the link field before importing.',
        variant: 'destructive',
      });
      return;
    }

    setIsExtractingUrl(true);
    const result = await extractUrlTextAction(candidateUrl);
    setIsExtractingUrl(false);

    if (result.error) {
      toast({
        title: 'Extraction Failed',
        description: result.error,
        variant: 'destructive',
      });
    } else if (result.text) {
      formMethods.setValue('jobDescription', result.text);
      setJobUrl(candidateUrl);
      toast({
        title: 'Job posting imported',
        description: 'We fetched the page and cleaned it into a usable job description.',
      });
      // Trigger background question detection after URL extraction
      handleDetectQuestions(result.text);
    }
  };

  const handlePasteJobUrl = async () => {
    try {
      setIsPasting('jobUrl');
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobUrl(text.trim());
        toast({
          title: 'Link pasted',
          description: 'Your job posting link is ready to import.',
        });
      }
    } catch {
      toast({
        title: 'Paste Failed',
        description: 'Please ensure you have granted clipboard permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsPasting(null);
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
    <div className="space-y-3">
      <div className="rounded-2xl border bg-muted/30 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <LinkIcon className="h-3.5 w-3.5" />
              Import from Job Posting Link
            </div>
            <Input
              value={jobUrl}
              onChange={(event) => setJobUrl(event.target.value)}
              placeholder="Paste the job posting URL here"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="bg-background"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              We fetch the page, pull the likely job posting content, and clean it before filling the description.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePasteJobUrl}
              disabled={isPasting === 'jobUrl'}
              className="sm:self-end"
            >
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Paste Link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExtractUrl}
              disabled={isExtractingUrl}
              className="sm:self-end"
            >
              {isExtractingUrl ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Import Job Posting
            </Button>
          </div>
        </div>
      </div>
      <div className='flex flex-wrap items-center justify-start gap-2 sm:justify-end'>
        <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => handlePaste('jobDescription')}
            disabled={isPasting === 'jobDescription'}
            className="-mt-1 text-muted-foreground hover:text-primary"
        >
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Paste J.D.
        </Button>
      </div>
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
                Add the target role and your background here, then continue to build your application.
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
                      placeholder="Paste the full job description text here, or import it from a job posting link below."
                      footer={urlExtractorTrigger}
                      onAction={handleExtractUrl}
                      isActionLoading={isExtractingUrl}
                      actionLabel="Import from Link"
                      actionIcon={<Sparkles className="mr-2 h-4 w-4 text-amber-500" />}
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
