
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
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState, useTransition } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  AllGenerationResults,
  extractJobDetailsAction,
  generateAction,
} from '@/app/actions';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { InputForm } from '@/components/input-form';
import { JobSparkLogo } from '@/components/job-spark-logo';
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
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { JobApplicationData, SavedJob } from '@/lib/schemas';
import { JobApplicationSchema } from '@/lib/schemas';
import type { ActiveView, GenerationType } from '@/components/job-spark-app';

const LOCAL_STORAGE_KEY_FORM = 'jobspark_form_data';
const LOCAL_STORAGE_KEY_JOBS = 'jobspark_saved_jobs';

export default function JobMatcherPage() {
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const {
    bio,
    setBio,
    setIsCoPilotSidebarOpen,
    _handleCoPilotSubmitInternal,
  } = useAppContext();

  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: '', bio: '', questions: '' },
  });

  // This effect is the key to connecting the AI tools to the form.
  // It creates a context with the necessary functions and passes it to the global submit handler.
  useEffect(() => {
    const toolContext = {
      getFormFields: () => formMethods.getValues(),
      updateFormFields: (updates: Record<string, string>) => {
        Object.entries(updates).forEach(([fieldName, value]) => {
          // Use 'any' to bypass strict typing for dynamic field names.
          formMethods.setValue(fieldName as any, value);
        });
      },
      generateJobMaterial: (generationType: string) => {
        handleGeneration(generationType as GenerationType);
      },
    };

    // Replace the default handler with one that includes our tool context.
    (window as any)._handleCoPilotSubmit = (message: string) =>
      _handleCoPilotSubmitInternal(message, toolContext);

    // Cleanup function to restore the original handler if the component unmounts.
    return () => {
      delete (window as any)._handleCoPilotSubmit;
    };
  }, [formMethods, _handleCoPilotSubmitInternal]); // Dependencies ensure this runs if the form or handler changes.

  // When the global bio changes (e.g., from the sidebar), update the form
  useEffect(() => {
    formMethods.setValue('bio', bio);
  }, [bio, formMethods]);

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
        if (parsedData.bio) {
          setBio(parsedData.bio); // Sync loaded bio with global state
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
          allResults: allResults, // Persist results with form data
        };
        // Also update the global bio state when the form field changes
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
  };

  const handleClear = () => {
    formMethods.reset({ jobDescription: '', bio: '', questions: '' });
    setAllResults({});
    setActiveView('none');
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

        const updatedSavedJobs = [newSavedJob, ...savedJobs];
        setSavedJobs(updatedSavedJobs);
        localStorage.setItem(
          LOCAL_STORAGE_KEY_JOBS,
          JSON.stringify(updatedSavedJobs)
        );

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
      });
    });
  };

  const handleLoadJob = (job: SavedJob) => {
    formMethods.reset(job.formData);
    setBio(job.formData.bio); // Sync with global state
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
    const updatedSavedJobs = savedJobs.filter((job) => job.id !== jobId);
    setSavedJobs(updatedSavedJobs);
    localStorage.setItem(
      LOCAL_STORAGE_KEY_JOBS,
      JSON.stringify(updatedSavedJobs)
    );
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

  const baseButtonClass =
    'h-auto flex-col rounded-full py-2 text-primary-foreground hover:bg-primary/70 hover:text-primary-foreground/90 data-[active=true]:bg-primary-foreground data-[active=true]:text-primary data-[active=true]:hover:bg-primary-foreground/90';

  return (
    <div className="flex flex-1 flex-col bg-muted/20">
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
            <Button
              variant="outline"
              onClick={() => setIsCoPilotSidebarOpen(true)}
            >
              <Bot className="mr-2 h-4 w-4" /> Co-pilot
            </Button>
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

            <div className="sticky bottom-0 z-10 -mb-8 w-full bg-gradient-to-t from-background via-background/90 to-transparent py-4">
              <div className="mx-auto grid w-full max-w-lg grid-cols-2 gap-1 rounded-full bg-primary p-1 shadow-lg sm:grid-cols-4">
                <Button
                  onClick={() => handleGeneration('coverLetter')}
                  disabled={isGenerating}
                  variant="ghost"
                  data-active={activeView === 'coverLetter'}
                  className={baseButtonClass}
                >
                  {isGenerating && activeView === 'coverLetter' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <FileText />
                  )}
                  <span className="text-xs">Cover Letter</span>
                </Button>

                <Button
                  onClick={() => handleGeneration('cv')}
                  disabled={isGenerating}
                  variant="ghost"
                  data-active={activeView === 'cv'}
                  className={baseButtonClass}
                >
                  {isGenerating && activeView === 'cv' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Briefcase />
                  )}
                  <span className="text-xs">CV</span>
                </Button>

                <Button
                  onClick={() => handleGeneration('deepAnalysis')}
                  disabled={isGenerating}
                  variant="ghost"
                  data-active={activeView === 'deepAnalysis'}
                  className={baseButtonClass}
                >
                  {isGenerating && activeView === 'deepAnalysis' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Lightbulb />
                  )}
                  <span className="text-xs">Analysis</span>
                </Button>

                <Button
                  onClick={() => handleGeneration('qAndA')}
                  disabled={isGenerating}
                  variant="ghost"
                  data-active={activeView === 'qAndA'}
                  className={baseButtonClass}
                >
                  {isGenerating && activeView === 'qAndA' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <MessageSquareMore />
                  )}
                  <span className="text-xs">Q & A</span>
                </Button>
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
