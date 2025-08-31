
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquareMore,
  Save,
  Trash2,
  Bot,
  AlertTriangle,
  User,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  AllGenerationResults,
  extractJobDetailsAction,
  generateAction,
} from '@/app/actions';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { InputForm } from '@/components/input-form';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { OutputView } from '@/components/output-view';
import { SavedJobsCarousel } from '@/components/saved-jobs-carousel';
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
import { Button } from '@/components/ui/button';
import { useAuth, useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { JobApplicationData, SavedJob } from '@/lib/schemas';
import { JobApplicationSchema } from '@/lib/schemas';
import type { ActiveView, GenerationType } from '@/components/job-spark-app';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY_FORM = 'jobspark_form_data';

export default function JobMatcherPage() {
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const { user, authLoading } = useAuth();
  const {
    bio,
    setBio,
    setIsCoPilotSidebarOpen,
    setToolContext,
    savedJobs,
    setSavedJobs,
  } = useAppContext();

  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: '', bio: '', questions: '' },
  });

  const handleGeneration = useCallback((generationType: GenerationType) => {
    formMethods.trigger(['jobDescription', 'bio']).then((isValid) => {
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: 'Please fill out both Job Description and Bio fields.',
        });
        return;
      }

      if (generationType === 'qAndA' && !formMethods.getValues('questions')) {
        toast({
          variant: 'destructive',
          title: 'Please provide specific questions to answer.',
        });
        return;
      }

      const data = { ...formMethods.getValues(), generationType };

      setActiveView(generationType);
      setGenerationError(null);

      setAllResults((prev) => {
        const newResults = { ...prev };
        delete newResults[generationType];
        return newResults;
      });

      startGenerating(async () => {
        const response = await generateAction(data);
        setAllResults((prev) => ({
            ...prev,
            [generationType]: response,
        }));
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods, toast]);

  // This effect provides the tool functions to the global context.
  useEffect(() => {
    setToolContext({
      getFormFields: () => formMethods.getValues(),
      updateFormFields: (updates: Record<string, string>) => {
        Object.entries(updates).forEach(([fieldName, value]) => {
          formMethods.setValue(fieldName as any, value);
        });
      },
      generateJobMaterial: (generationType: string) => {
        handleGeneration(generationType as GenerationType);
      },
    });

    return () => {
      setToolContext(null);
    };
  }, [formMethods, setToolContext, handleGeneration]);


  useEffect(() => {
    formMethods.setValue('bio', bio);
  }, [bio, formMethods]);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY_FORM);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        formMethods.reset({
          jobDescription: parsedData.jobDescription || '',
          bio: parsedData.bio || '',
          questions: parsedData.questions || '',
        });
        if (parsedData.bio) {
          setBio(parsedData.bio); 
        }
        if (parsedData.allResults) {
          setAllResults(parsedData.allResults);
        }
      }
    } catch (e) {
      console.error('Failed to load or parse data from localStorage', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods]);

  useEffect(() => {
    const subscription = formMethods.watch((value) => {
      try {
        const dataToSave = {
          jobDescription: value.jobDescription,
          bio: value.bio,
          questions: value.questions,
          allResults: allResults,
        };
        if (value.bio !== bio) {
          setBio(value.bio || '');
        }
        localStorage.setItem(
          LOCAL_STORAGE_KEY_FORM,
          JSON.stringify(dataToSave)
        );
      } catch (e) {
        console.error('Failed to save data to localStorage', e);
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods, formMethods.watch, allResults, bio, setBio]);

  useEffect(() => {
    if (activeView !== 'none' && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeView]);

  const handleClear = () => {
    formMethods.reset({ jobDescription: '', bio: '', questions: '' });
    setAllResults({});
    setActiveView('none');
    setGenerationError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_FORM);
    } catch (e) {
      console.error('Failed to clear data from localStorage', e);
    }
  };

  const handleSaveJob = () => {
    formMethods.trigger('jobDescription').then((isValid) => {
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: 'A job description is required to save.',
        });
        return;
      }
      if (Object.keys(allResults).length === 0) {
        toast({
          variant: 'destructive',
          title: 'Nothing to Save',
          description: 'Please generate at least one output before saving.',
        });
        return;
      }

      startSaving(async () => {
        const { jobDescription, bio, questions } = formMethods.getValues();
        const detailsResponse = await extractJobDetailsAction({
            jobDescription,
        });

        const newSavedJob: SavedJob = {
            id: crypto.randomUUID(),
            ...detailsResponse,
            formData: { jobDescription, bio, questions },
            allResults,
            savedAt: new Date().toISOString(),
        };

        setSavedJobs(prev => [newSavedJob, ...prev]);

        toast({
            title: 'Job Saved!',
            description: `${newSavedJob.jobTitle} at ${newSavedJob.companyName} has been saved.`,
        });

        formMethods.reset({
            jobDescription: '',
            bio: formMethods.getValues('bio'),
            questions: '',
        });
        setAllResults({});
        setActiveView('none');
      });
    });
  };

  const handleLoadJob = (job: SavedJob) => {
    formMethods.reset(job.formData);
    setBio(job.formData.bio);
    setAllResults(job.allResults);
    setActiveView(
      (Object.keys(job.allResults)[0] as ActiveView) || 'none'
    );
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY_FORM,
        JSON.stringify({ ...job.formData, allResults: job.allResults })
      );
    } catch (e) {
      console.error('Failed to save loaded data to localStorage', e);
    }
    toast({
      title: 'Job Loaded!',
      description: `Loaded application for ${job.jobTitle}`,
    });
  };

  const handleDeleteJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter((job) => job.id !== jobId));
    toast({ title: 'Job Deleted' });
  };

  const { jobDescription } = formMethods.getValues();

  const getLastGeneratedOutput = (): string => {
    if (activeView === 'none' || !allResults[activeView]) return '';
    try {
      return JSON.stringify(allResults[activeView], null, 2);
    } catch {
      return '';
    }
  };

  const ActionButton = ({
      generationType,
      icon: Icon,
      label
  }: {
      generationType: GenerationType,
      icon: React.ElementType,
      label: string
  }) => (
      <Card
          onClick={() => handleGeneration(generationType)}
          data-active={activeView === generationType}
          className={cn(
            'group cursor-pointer text-center transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
            'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-lg data-[active=true]:-translate-y-1'
          )}
      >
        <div className="flex flex-col items-center justify-center gap-2 p-4">
          <Icon className="h-6 w-6 text-primary transition-colors group-data-[active=true]:text-primary-foreground" />
          <span className="font-semibold text-sm">{label}</span>
          {isGenerating && activeView === generationType && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
          )}
        </div>
      </Card>
  );

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
      <header className="sticky top-0 z-10 w-full border-b border-b-accent bg-primary px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to Home">
              <AiJobAssistLogo className="h-10 w-10 text-primary-foreground" />
            </Link>
            <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                AI Job Assist
              </h1>
              <div className="text-xs text-primary-foreground/80">
                Job Matching Assistant
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCoPilotSidebarOpen(true)}
            >
              <Bot className="mr-2 h-4 w-4" /> Co-pilot
            </Button>
            {authLoading ? (
              <Button variant="outline" size="icon" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : user ? (
              <Button asChild variant="outline">
                <Link href="/account">
                  <User className="mr-2 h-4 w-4" /> Account
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">Log In</Link>
              </Button>
            )}
            <ThemeToggleButton />
            <FeedbackDialog
              jobDescription={jobDescription}
              bio={bio}
              lastGeneratedOutput={getLastGeneratedOutput()}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-8 sm:p-6 md:p-8">
        <FormProvider {...formMethods}>
          <div className="flex flex-col gap-8">
            <InputForm />
            <div className="flex items-center justify-end gap-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2" />
                    Clear Everything
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-6 w-6 text-destructive" />
                      Are you sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently clear the job description, bio, and
                      all generated content. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClear}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveJob}
                disabled={isSaving}
                aria-label="Save Job"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Save className="mr-2" />
                )}
                Save Job
              </Button>
            </div>

            <div className="w-full">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <ActionButton generationType="coverLetter" icon={FileText} label="Cover Letter" />
                    <ActionButton generationType="cv" icon={Briefcase} label="CV" />
                    <ActionButton generationType="deepAnalysis" icon={Lightbulb} label="Analysis" />
                    <ActionButton generationType="qAndA" icon={MessageSquareMore} label="Q & A" />
                </div>
            </div>

            <div ref={outputRef} className="pt-8">
              {activeView !== 'none' && (
                <OutputView
                  activeView={activeView}
                  setActiveView={setActiveView}
                  allResults={allResults}
                  setAllResults={setAllResults}
                  isGenerating={isGenerating}
                  generationError={generationError}
                  onRetry={() => handleGeneration(activeView as GenerationType)}
                />
              )}
            </div>
          </div>
        </FormProvider>
      </main>

      {savedJobs.length > 0 && (
        <section className="w-full border-t bg-muted/60 py-8">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-8">
            <SavedJobsCarousel
              savedJobs={savedJobs}
              onLoadJob={handleLoadJob}
              onDeleteJob={handleDeleteJob}
            />
          </div>
        </section>
      )}
    </div>
  );
}
