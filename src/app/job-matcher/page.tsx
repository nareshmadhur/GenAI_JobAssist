
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
  LogOut,
  Sparkles,
  MoreVertical,
  List,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState, useTransition, useCallback, Suspense } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth, useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import type { JobApplicationData, SavedJob } from '@/lib/schemas';
import { JobApplicationSchema } from '@/lib/schemas';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

export type GenerationType =
  | 'coverLetter'
  | 'cv'
  | 'deepAnalysis'
  | 'qAndA';
export type ActiveView = GenerationType | 'none';


const LOCAL_STORAGE_KEY_FORM = 'ai_job_assist_form_data';
const LOCAL_STORAGE_KEY_QUERY_COUNT = 'ai_job_assist_query_count';
const FREE_QUERY_LIMIT = 5;

function JobMatcherContent() {
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const [queryCount, setQueryCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isInitialFormLoad, setIsInitialFormLoad] = useState(true);

  
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, authLoading, logout } = useAuth();
  const {
    setIsCoPilotSidebarOpen,
    setToolContext,
    savedJobs,
    setSavedJobs,
  } = useAppContext();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: '', workRepository: '', questions: '' },
  });

  // Load query count from localStorage on mount
  useEffect(() => {
    if (!user) {
      const savedCount = localStorage.getItem(LOCAL_STORAGE_KEY_QUERY_COUNT);
      setQueryCount(savedCount ? parseInt(savedCount, 10) : 0);
    } else {
      setQueryCount(0); // Reset for logged-in users
    }
  }, [user]);

  const handleGeneration = useCallback((generationType: GenerationType) => {
    // Check query limit for guest users
    if (!user && queryCount >= FREE_QUERY_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }
    
    formMethods.trigger(['jobDescription', 'workRepository']).then((isValid) => {
      if (!isValid) {
        toast({
          variant: 'destructive',
          title: 'Please fill out both Job Description and Work Repository fields.',
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
        
        if ('error' in response) {
          console.error('Generation failed:', response.error);
          setGenerationError(response.error);
        } else {
          setAllResults((prev) => ({
            ...prev,
            [generationType]: response,
          }));

          // Increment query count for guest users
          if (!user) {
            const newCount = queryCount + 1;
            setQueryCount(newCount);
            localStorage.setItem(LOCAL_STORAGE_KEY_QUERY_COUNT, newCount.toString());
            // Show feedback reminder on the 3rd query
            if (newCount === 3) {
              toast({
                title: 'Enjoying the app?',
                description: 'Your feedback helps us improve. Click the heart icon to share your thoughts!',
                duration: 8000,
              });
            }
          }
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods, toast, user, queryCount]);

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
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY_FORM);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        formMethods.reset({
          jobDescription: parsedData.jobDescription || '',
          workRepository: parsedData.workRepository || parsedData.bio || '',
          questions: parsedData.questions || '',
        });
        if (parsedData.allResults) {
          setAllResults(parsedData.allResults);
        }
      }
    } catch (e) {
      console.error('Failed to load or parse data from localStorage', e);
    } finally {
        setIsInitialFormLoad(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formMethods]);

  useEffect(() => {
    const subscription = formMethods.watch((value) => {
      try {
        const dataToSave = {
          jobDescription: value.jobDescription,
          workRepository: value.workRepository,
          questions: value.questions,
          allResults: allResults,
        };
        localStorage.setItem(
          LOCAL_STORAGE_KEY_FORM,
          JSON.stringify(dataToSave)
        );
      } catch (e) {
        console.error('Failed to save data to localStorage', e);
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods, formMethods.watch, allResults]);

  useEffect(() => {
    if (activeView !== 'none' && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeView]);

  // Handle loading job from URL param
  useEffect(() => {
    if (jobId && savedJobs.length > 0 && isInitialFormLoad) {
      const jobToLoad = savedJobs.find(j => j.id === jobId);
      if (jobToLoad) {
        handleLoadJob(jobToLoad);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, savedJobs, isInitialFormLoad]);

  const handleClear = () => {
    formMethods.reset({ jobDescription: '', workRepository: '', questions: '' });
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
        const { jobDescription, workRepository, questions } = formMethods.getValues();
        const detailsResponse = await extractJobDetailsAction({
            jobDescription,
        });

        if ('error' in detailsResponse) {
          toast({
            variant: 'destructive',
            title: 'Could not save job',
            description: detailsResponse.error,
          });
          return;
        }

        const newSavedJob: SavedJob = {
            id: crypto.randomUUID(),
            ...detailsResponse,
            formData: { jobDescription, workRepository, questions },
            allResults,
            savedAt: new Date().toISOString(),
            status: 'draft',
        };

        setSavedJobs(prev => [newSavedJob, ...prev]);

        toast({
            title: 'Application Saved to Tracker!',
            description: (
              <div className="mt-1 flex flex-col gap-3">
                <p className="text-sm">"{newSavedJob.jobTitle}" has been added to your application pipeline.</p>
                <Button asChild variant="secondary" size="sm" className="w-fit h-8 px-3 text-xs">
                  <Link href="/admin">Go to Application Tracker</Link>
                </Button>
              </div>
            ),
        });
      });
    });
  };

  const handleLoadJob = (job: SavedJob) => {
    formMethods.reset(job.formData);
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

  const { jobDescription, workRepository } = formMethods.getValues();

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
  }) => {
      const hasResult = !!allResults[generationType];
      return (
      <Card
          onClick={() => handleGeneration(generationType)}
          data-active={activeView === generationType}
          className={cn(
            'relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-md bg-card/60 backdrop-blur-sm border-muted-foreground/10',
            'data-[active=true]:bg-primary/5 data-[active=true]:border-primary/50 data-[active=true]:shadow-primary/5'
          )}
      >
        <div className="flex items-center gap-4 p-4 lg:p-5">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            activeView === generationType ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
            hasResult && activeView !== generationType && "bg-success/10 text-success"
          )}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col flex-1 text-left">
            <span className={cn(
                "font-semibold text-sm transition-colors",
                activeView === generationType ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}>{label}</span>
            {hasResult && <span className="text-[10px] uppercase tracking-wider text-success font-bold mt-1">Ready</span>}
          </div>
          {isGenerating && activeView === generationType && (
              <Loader2 className="h-5 w-5 animate-spin text-primary ml-2" />
          )}
        </div>
      </Card>
  )};

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
                Application Studio
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              {!user && !authLoading && (
                <div className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                  <span>{Math.max(0, FREE_QUERY_LIMIT - queryCount)} Free Queries Left</span>
                </div>
              )}
              <Button asChild variant="outline" className="hidden lg:flex">
                <Link href="/admin">
                  <List className="mr-2 h-4 w-4" /> Application Tracker
                </Link>
              </Button>
              {authLoading ? (
                <Button variant="outline" size="icon" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <List className="mr-2 h-4 w-4" /> Application Tracker
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/login">Log In</Link>
                </Button>
              )}
              <ThemeToggleButton />
              <FeedbackDialog
                jobDescription={jobDescription}
                workRepository={workRepository}
                lastGeneratedOutput={getLastGeneratedOutput()}
              />
            </div>

            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {authLoading ? (
                    <DropdownMenuItem disabled>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                    </DropdownMenuItem>
                    ) : user ? (
                    <>
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                      </DropdownMenuItem>
                    </>
                    ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/login"><User className="mr-2 h-4 w-4" /> Log In / Sign Up</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <FeedbackDialog
                      jobDescription={jobDescription}
                      workRepository={workRepository}
                      lastGeneratedOutput={getLastGeneratedOutput()}
                    />
                     <span className="ml-2">Give Feedback</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ThemeToggleButton />
                    <span className="ml-2">Toggle Theme</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-8 sm:p-6 md:p-8">
        <FormProvider {...formMethods}>
          <div className="flex flex-col gap-8">
            <InputForm isInitialLoading={isInitialFormLoad} />
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
                disabled={isSaving || !user}
                aria-label="Save Job"
                className="shadow-sm shadow-primary/10"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 animate-spin" />
                ) : (
                  <Save className="mr-2" />
                )}
                Save Job
              </Button>
              {savedJobs.length > 0 && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:bg-primary/5"
                >
                  <Link href="/admin">
                    <List className="mr-2 h-4 w-4" /> Go to Tracker
                  </Link>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="mb-2">
                  <h3 className="font-headline text-xl font-bold text-foreground">Application Studio</h3>
                  <p className="text-sm text-muted-foreground mt-1">Select an artifact below to generate it using your supplied details.</p>
                </div>
                <ActionButton generationType="cv" icon={Briefcase} label="ATS-Optimized Resume" />
                <ActionButton generationType="coverLetter" icon={FileText} label="Tailored Cover Letter" />
                <ActionButton generationType="qAndA" icon={MessageSquareMore} label="Interview Simulator" />
                <ActionButton generationType="deepAnalysis" icon={Lightbulb} label="Strategic Role Analysis" />
              </div>

              <div ref={outputRef} className="lg:col-span-8">
                {activeView !== 'none' ? (
                  <OutputView
                    activeView={activeView}
                    setActiveView={setActiveView}
                    allResults={allResults}
                    setAllResults={setAllResults}
                    isGenerating={isGenerating}
                    generationError={generationError}
                    onRetry={() => handleGeneration(activeView as GenerationType)}
                  />
                ) : (
                  <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-card/30 p-8 text-center transition-colors hover:border-primary/30 hover:bg-card/50">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary/40 mb-6">
                      <Bot className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground tracking-tight">Ready to Build</h3>
                    <p className="text-base text-muted-foreground max-w-sm mt-3">Provide your target job description and work repository, then select an artifact from the studio menu to begin generation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </FormProvider>
      </main>


      
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Free Queries Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You've used all your free queries for this session. Please log in or sign up to continue generating unlimited content and save your work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href="/login">Log In / Sign Up</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function JobMatcherPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <JobMatcherContent />
    </Suspense>
  );
}
