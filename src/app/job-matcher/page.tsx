
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Sparkles, Trash2, Plus, List, Loader2, AlertTriangle } from 'lucide-react';
import React, { useEffect, useRef, useState, useTransition } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import Link from 'next/link';

import { AllGenerationResults, generateAction, extractJobDetailsAction } from '@/app/actions';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { FloatingActionBar } from '@/components/floating-action-bar';
import { InputForm } from '@/components/input-form';
import { JobSparkLogo } from '@/components/job-spark-logo';
import { OutputView } from '@/components/output-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

import { useToast } from '@/hooks/use-toast';
import type { JobApplicationData, SavedJob } from '@/lib/schemas';
import { JobApplicationSchema } from '@/lib/schemas';
import { ActiveView, GenerationType } from '@/components/job-spark-app';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { SavedJobsSheet } from '@/components/saved-jobs-sheet';

const LOCAL_STORAGE_KEY_FORM = 'jobspark_form_data';
const LOCAL_STORAGE_KEY_JOBS = 'jobspark_saved_jobs';

export default function JobMatcherPage() {
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);

  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: '', bio: '', questions: '' },
  });

  // Load saved jobs from localStorage on initial mount
  useEffect(() => {
    try {
      const savedJobsData = localStorage.getItem(LOCAL_STORAGE_KEY_JOBS);
      if (savedJobsData) {
        setSavedJobs(JSON.parse(savedJobsData));
      }
    } catch (e) {
      console.error('Failed to load saved jobs from localStorage', e);
    }
  }, []);


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
      }
    } catch (e) {
      console.error('Failed to load or parse data from localStorage', e);
    }
  }, [formMethods]);

  useEffect(() => {
    const subscription = formMethods.watch((value) => {
      try {
        const dataToSave = {
          jobDescription: value.jobDescription,
          bio: value.bio,
          questions: value.questions,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY_FORM, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Failed to save data to localStorage', e);
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods.watch]);
  
  // This effect handles scrolling to the output view when it becomes active.
  // It runs after the component re-renders, ensuring the ref is attached.
  useEffect(() => {
    if (activeView !== 'none' && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeView]);

  const handleGeneration = (generationType: GenerationType) => {
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
        if (response.success) {
          setAllResults((prev) => ({
            ...prev,
            [generationType]: response.data,
          }));
        } else {
          setGenerationError(response.error);
        }
      });
    });
  };

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
        const detailsResponse = await extractJobDetailsAction({ jobDescription });

        if (!detailsResponse.success) {
          toast({
            variant: 'destructive',
            title: 'Could not extract job details.',
            description: detailsResponse.error,
          });
          return;
        }

        const newSavedJob: SavedJob = {
          id: crypto.randomUUID(),
          ...detailsResponse.data,
          formData: { jobDescription, bio, questions },
          allResults,
          savedAt: new Date().toISOString(),
        };

        const updatedSavedJobs = [...savedJobs, newSavedJob];
        setSavedJobs(updatedSavedJobs);
        localStorage.setItem(LOCAL_STORAGE_KEY_JOBS, JSON.stringify(updatedSavedJobs));

        toast({
          title: 'Job Saved!',
          description: `${newSavedJob.jobTitle} at ${newSavedJob.companyName} has been saved.`,
        });

        // Clear form for next application, but keep bio
        formMethods.reset({
          jobDescription: '',
          bio: formMethods.getValues('bio'),
          questions: '',
        });
        setAllResults({});
        setActiveView('none');
        setGenerationError(null);
      });
    });
  };

  const handleLoadJob = (job: SavedJob) => {
    formMethods.reset(job.formData);
    setAllResults(job.allResults);
    setActiveView(Object.keys(job.allResults)[0] as ActiveView || 'none');
  };

  const handleDeleteJob = (jobId: string) => {
    const updatedSavedJobs = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(updatedSavedJobs);
    localStorage.setItem(LOCAL_STORAGE_KEY_JOBS, JSON.stringify(updatedSavedJobs));
    toast({ title: 'Job Deleted' });
  };

  const { jobDescription, bio } = formMethods.getValues();

  const getLastGeneratedOutput = (): string => {
    if (activeView === 'none' || !allResults[activeView]) return '';
    try {
      return JSON.stringify(allResults[activeView], null, 2);
    } catch {
      return '';
    }
  };

  return (
    <div className="flex w-full flex-col bg-muted/20 flex-1">
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
                Job Matching Assistant
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <ThemeToggleButton />
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Clear All">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className='flex items-center gap-2'>
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
                  <AlertDialogAction onClick={handleClear}>
                    Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleSaveJob}
              disabled={isSaving}
              aria-label="Save Job"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
            
            <SavedJobsSheet
              savedJobs={savedJobs}
              onLoadJob={handleLoadJob}
              onDeleteJob={handleDeleteJob}
            />

            <FeedbackDialog
              jobDescription={jobDescription}
              bio={bio}
              lastGeneratedOutput={getLastGeneratedOutput()}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-32 sm:p-6 md:p-8">
        <FormProvider {...formMethods}>
          <div className="flex flex-col gap-8">
            <InputForm />
            <div ref={outputRef}>
              {activeView !== 'none' && (
                <OutputView
                  activeView={activeView}
                  setActiveView={setActiveView}
                  allResults={allResults}
                  setAllResults={setAllResults}
                  isGenerating={isGenerating}
                  generationError={generationError}
                />
              )}
            </div>
          </div>
        </FormProvider>
      </main>

      <FloatingActionBar
        isGenerating={isGenerating}
        activeView={activeView}
        onGeneration={handleGeneration}
      />
    </div>
  );
}
