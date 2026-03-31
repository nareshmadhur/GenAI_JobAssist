
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
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState, useTransition, useCallback, Suspense } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  AllGenerationResults,
  extractJobDetailsAction,
  generateAction,
  generateInterviewPrepAction,
} from '@/app/actions';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { InputForm } from '@/components/input-form';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { OutputView } from '@/components/output-view';
import { LoadingProgress } from '@/components/loading-progress';
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
import type { JobApplicationData, ResultInputSignatures, SavedJob } from '@/lib/schemas';
import { JobApplicationSchema } from '@/lib/schemas';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SavedJobView } from '@/lib/schemas';

export type GenerationType =
  | 'coverLetter'
  | 'cv'
  | 'deepAnalysis'
  | 'qAndA';
export type ActiveView = GenerationType | 'none';
type JobMeta = { jobTitle: string; companyName: string };
type WorkspaceView = 'prepare' | 'build';
type SaveIndicatorState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';


const LOCAL_STORAGE_KEY_FORM = 'ai_job_assist_form_data';
const LOCAL_STORAGE_KEY_QUERY_COUNT = 'ai_job_assist_query_count';
const FREE_QUERY_LIMIT = 5;
const GENERATION_ORDER: GenerationType[] = ['deepAnalysis', 'cv', 'coverLetter', 'qAndA'];

const isSavedJobView = (value: string | null): value is SavedJobView =>
  value === 'deepAnalysis' || value === 'cv' || value === 'coverLetter' || value === 'qAndA';

const getGenerationInputSignature = (
  formValues: Omit<JobApplicationData, 'generationType'>,
  generationType: GenerationType
) =>
  JSON.stringify({
    jobDescription: formValues.jobDescription.trim(),
    workRepository: formValues.workRepository.trim(),
    questions: generationType === 'qAndA' ? (formValues.questions || '').trim() : undefined,
  });

function JobMatcherContent() {
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [view, setView] = useState<WorkspaceView>('prepare');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const [queryCount, setQueryCount] = useState(0);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isInitialFormLoad, setIsInitialFormLoad] = useState(true);
  const [jobMeta, setJobMeta] = useState<JobMeta | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveIndicatorState>('idle');
  const [resultInputSignatures, setResultInputSignatures] = useState<ResultInputSignatures>({});
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  const previousViewRef = useRef<WorkspaceView>('prepare');
  const suppressNextOutputScrollRef = useRef(false);
  const router = useRouter();
  const { user, authLoading, logout } = useAuth();
  const {
    handleCoPilotSubmit,
    setIsCoPilotSidebarOpen,
    setToolContext,
    savedJobs,
    setSavedJobs,
  } = useAppContext();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const activeSectionParam = searchParams.get('section');

  const scrollPageToTop = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: '', workRepository: '', questions: '' },
  });
  const watchedJobDescription = formMethods.watch('jobDescription');
  const watchedWorkRepository = formMethods.watch('workRepository');
  const watchedQuestions = formMethods.watch('questions');

  const getFallbackJobMeta = useCallback((jobDescription: string): JobMeta => {
    const firstLine = jobDescription
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean);

    return {
      jobTitle: firstLine?.slice(0, 60) || 'New Application',
      companyName: 'Target Company',
    };
  }, []);

  const getFirstAvailableView = useCallback((results: AllGenerationResults): ActiveView => {
    return GENERATION_ORDER.find((key) => Boolean(results[key])) || 'none';
  }, []);

  const refreshJobMeta = useCallback(async (jobDescription: string) => {
    const fallback = getFallbackJobMeta(jobDescription);
    setJobMeta(fallback);

    try {
      const detailsResponse = await extractJobDetailsAction({ jobDescription });
      if ('error' in detailsResponse) {
        return fallback;
      }

      const resolvedMeta = {
        jobTitle: detailsResponse.jobTitle || fallback.jobTitle,
        companyName: detailsResponse.companyName || fallback.companyName,
      };
      setJobMeta(resolvedMeta);
      return resolvedMeta;
    } catch {
      return fallback;
    }
  }, [getFallbackJobMeta]);

  const resolveSavedJobView = useCallback((job: SavedJob, preferredView?: string | null): GenerationType => {
    const candidates: Array<string | undefined | null> = [
      preferredView,
      job.lastActiveView,
      job.allResults.deepAnalysis ? 'deepAnalysis' : undefined,
      getFirstAvailableView(job.allResults),
    ];

    const nextView = candidates.find(
      (candidate): candidate is GenerationType => {
        const normalizedCandidate: GenerationType | null =
          candidate && isSavedJobView(candidate) ? candidate : null;
        if (!normalizedCandidate) {
          return false;
        }

        return Boolean(job.allResults[normalizedCandidate]);
      }
    );

    return nextView || 'deepAnalysis';
  }, [getFirstAvailableView]);

  const buildResultInputSignatures = useCallback((
    formValues: Omit<JobApplicationData, 'generationType'>,
    results: AllGenerationResults,
    existingSignatures?: ResultInputSignatures
  ): ResultInputSignatures => {
    const nextSignatures: ResultInputSignatures = { ...(existingSignatures || {}) };

    GENERATION_ORDER.forEach((generationType) => {
      if (results[generationType]) {
        nextSignatures[generationType] =
          existingSignatures?.[generationType] ||
          getGenerationInputSignature(formValues, generationType);
      }
    });

    return nextSignatures;
  }, []);

  // Load query count from localStorage on mount
  useEffect(() => {
    if (!user) {
      const savedCount = localStorage.getItem(LOCAL_STORAGE_KEY_QUERY_COUNT);
      setQueryCount(savedCount ? parseInt(savedCount, 10) : 0);
    } else {
      setQueryCount(0); // Reset for logged-in users
    }
  }, [user]);

  const handleContinueToBuild = useCallback(async () => {
    const isValid = await formMethods.trigger(['jobDescription', 'workRepository']);
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Please fill out both Job Description and Work Repository fields.',
      });
      return;
    }

    void refreshJobMeta(formMethods.getValues('jobDescription'));
    suppressNextOutputScrollRef.current = true;
    setActiveView((current) => (current === 'none' ? 'deepAnalysis' : current));
    setView('build');
    scrollPageToTop();
  }, [formMethods, refreshJobMeta, scrollPageToTop, toast]);

  const openExistingResult = useCallback((generationType: GenerationType) => {
    setActiveView(generationType);
    setGenerationError(null);
    setView('build');
  }, []);

  const handleGeneration = useCallback((generationType: GenerationType, options?: { force?: boolean }) => {
    const shouldForceRegenerate = options?.force ?? false;

    if (!shouldForceRegenerate && allResults[generationType]) {
      openExistingResult(generationType);
      return;
    }

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
      setView('build');

      if (shouldForceRegenerate) {
        setAllResults((prev) => {
          const newResults = { ...prev };
          delete newResults[generationType];
          return newResults;
        });
        setResultInputSignatures((prev) => {
          const next = { ...prev };
          delete next[generationType];
          return next;
        });
      }

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
          setResultInputSignatures((prev) => ({
            ...prev,
            [generationType]: getGenerationInputSignature(formMethods.getValues(), generationType),
          }));
          void refreshJobMeta(jobDescription);

          // If Q&A is generated, also trigger Interview Prep in the background if not already present
          if (generationType === 'qAndA' && !allResults.interviewPrep) {
            generateInterviewPrepAction(data).then(ip => {
              if (!('error' in ip)) {
                setAllResults(prev => ({ ...prev, interviewPrep: ip }));
              }
            });
          }

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
  }, [allResults, formMethods, openExistingResult, queryCount, refreshJobMeta, toast, user]);

  const handleGenerateAll = useCallback(async () => {
    const hasQuestions = Boolean(formMethods.getValues('questions')?.trim());
    const primaryViews: GenerationType[] = hasQuestions
      ? ['coverLetter', 'cv', 'deepAnalysis', 'qAndA']
      : ['coverLetter', 'cv', 'deepAnalysis'];
    const missingViews = primaryViews.filter((key) => !allResults[key]);
    const firstAvailableView = getFirstAvailableView(allResults);

    if (missingViews.length === 0 && firstAvailableView !== 'none') {
      setActiveView('deepAnalysis');
      setView('build');
      toast({
        title: 'Everything is already ready',
        description: 'Opening your saved application instead of regenerating it.',
      });
      return;
    }

    if (!user && queryCount >= FREE_QUERY_LIMIT) {
      setShowLoginPrompt(true);
      return;
    }

    const isValid = await formMethods.trigger(['jobDescription', 'workRepository']);
    if (!isValid) {
      toast({ variant: 'destructive', title: 'Please fill out both fields before generating.' });
      return;
    }
    setIsGeneratingAll(true);
    setGenerationError(null);
    setActiveView('deepAnalysis');
    setView('build');

    const { jobDescription, workRepository, questions } = formMethods.getValues();
    const base = { jobDescription, workRepository };

    try {
      void refreshJobMeta(jobDescription);

      const [cl, cv, qa, da, ip] = await Promise.all([
        allResults.coverLetter
          ? Promise.resolve(allResults.coverLetter)
          : generateAction({ ...base, generationType: 'coverLetter' }),
        allResults.cv
          ? Promise.resolve(allResults.cv)
          : generateAction({ ...base, generationType: 'cv' }),
        allResults.qAndA
          ? Promise.resolve(allResults.qAndA)
          : hasQuestions
            ? generateAction({ ...base, generationType: 'qAndA', questions: questions || '' })
            : Promise.resolve({ error: 'Skipped because no questions were provided.' }),
        allResults.deepAnalysis
          ? Promise.resolve(allResults.deepAnalysis)
          : generateAction({ ...base, generationType: 'deepAnalysis' }),
        allResults.interviewPrep
          ? Promise.resolve(allResults.interviewPrep)
          : hasQuestions
            ? generateInterviewPrepAction(base)
            : Promise.resolve({ error: 'Skipped because no questions were provided.' }),
      ]);

      setAllResults((prev) => ({
        ...prev,
        coverLetter: prev.coverLetter || ('error' in cl ? undefined : cl as any),
        cv: prev.cv || ('error' in cv ? undefined : cv as any),
        qAndA: prev.qAndA || ('error' in qa ? undefined : qa as any),
        deepAnalysis: prev.deepAnalysis || ('error' in da ? undefined : da as any),
        interviewPrep: prev.interviewPrep || ('error' in ip ? undefined : ip as any),
      }));
      setResultInputSignatures((prev) => {
        const next = { ...prev };
        if (!('error' in cl)) {
          next.coverLetter = next.coverLetter || getGenerationInputSignature(formMethods.getValues(), 'coverLetter');
        }
        if (!('error' in cv)) {
          next.cv = next.cv || getGenerationInputSignature(formMethods.getValues(), 'cv');
        }
        if (!('error' in da)) {
          next.deepAnalysis = next.deepAnalysis || getGenerationInputSignature(formMethods.getValues(), 'deepAnalysis');
        }
        if (hasQuestions && !('error' in qa)) {
          next.qAndA = next.qAndA || getGenerationInputSignature(formMethods.getValues(), 'qAndA');
        }
        return next;
      });

      if (!hasQuestions) {
        toast({
          title: 'Interview materials skipped',
          description: 'Add or detect application questions to include interview simulation and coaching in the full suite.',
        });
      }

      if (!user) {
        const newCount = queryCount + 1;
        setQueryCount(newCount);
        localStorage.setItem(LOCAL_STORAGE_KEY_QUERY_COUNT, newCount.toString());
      }
    } catch (e: any) {
      setGenerationError(e.message || 'Generation failed.');
    } finally {
      setIsGeneratingAll(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults, formMethods, getFirstAvailableView, queryCount, refreshJobMeta, toast, user]);

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
        const restoredFormData = {
          jobDescription: parsedData.jobDescription || '',
          workRepository: parsedData.workRepository || parsedData.bio || '',
          questions: parsedData.questions || '',
        };
        formMethods.reset(restoredFormData);
        if (parsedData.allResults) {
          setAllResults(parsedData.allResults);
          setResultInputSignatures(
            parsedData.resultInputSignatures ||
              buildResultInputSignatures(restoredFormData, parsedData.allResults)
          );
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
          resultInputSignatures,
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
  }, [allResults, formMethods, formMethods.watch, resultInputSignatures]);

  useEffect(() => {
    if (previousViewRef.current !== view && view === 'build') {
      scrollPageToTop();
    }
    previousViewRef.current = view;
  }, [scrollPageToTop, view]);

  useEffect(() => {
    if (activeView !== 'none' && outputRef.current) {
      if (suppressNextOutputScrollRef.current) {
        suppressNextOutputScrollRef.current = false;
        return;
      }
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
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }
    formMethods.reset({ jobDescription: '', workRepository: '', questions: '' });
    setAllResults({});
    setActiveView('none');
    setGenerationError(null);
    setJobMeta(null);
    setCurrentJobId(null);
    setSaveStatus('idle');
    setResultInputSignatures({});
    setView('prepare');
    router.replace('/job-matcher', { scroll: false });
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY_FORM);
    } catch (e) {
      console.error('Failed to clear data from localStorage', e);
    }
  };

  const upsertCurrentJob = useCallback(async ({ showToast = false }: { showToast?: boolean } = {}) => {
    const { jobDescription, workRepository, questions } = formMethods.getValues();
    if (!jobDescription.trim() || !workRepository.trim() || Object.keys(allResults).length === 0) {
      setSaveStatus('idle');
      return null;
    }

    const fallbackMeta = getFallbackJobMeta(jobDescription);
    const existingJob = (currentJobId ? savedJobs.find((job) => job.id === currentJobId) : undefined) || null;
    let resolvedMeta = existingJob
      ? { jobTitle: existingJob.jobTitle, companyName: existingJob.companyName }
      : (jobMeta || fallbackMeta);

    const shouldRefreshDetails =
      !existingJob &&
      (!jobMeta ||
        jobMeta.jobTitle === fallbackMeta.jobTitle ||
        jobMeta.companyName === fallbackMeta.companyName);

    if (shouldRefreshDetails) {
      try {
        const detailsResponse = await extractJobDetailsAction({ jobDescription });
        if (!('error' in detailsResponse)) {
          resolvedMeta = {
            jobTitle: detailsResponse.jobTitle || fallbackMeta.jobTitle,
            companyName: detailsResponse.companyName || fallbackMeta.companyName,
          };
        }
      } catch {
        resolvedMeta = fallbackMeta;
      }
    }

    const nextJobId = existingJob?.id || currentJobId || crypto.randomUUID();
    const nextActiveView =
      activeView !== 'none'
        ? activeView
        : isSavedJobView(existingJob?.lastActiveView ?? null)
          ? existingJob!.lastActiveView
          : undefined;
    const nextSavedJob: SavedJob = {
      id: nextJobId,
      jobTitle: resolvedMeta.jobTitle,
      companyName: resolvedMeta.companyName,
      lastActiveView: nextActiveView,
      resultInputSignatures,
      formData: { jobDescription, workRepository, questions },
      allResults,
      savedAt: existingJob?.savedAt || new Date().toISOString(),
      status: existingJob?.status || 'draft',
    };

    if (existingJob) {
      const existingSnapshot = JSON.stringify({
        jobTitle: existingJob.jobTitle,
        companyName: existingJob.companyName,
        lastActiveView: existingJob.lastActiveView,
        resultInputSignatures: existingJob.resultInputSignatures,
        formData: existingJob.formData,
        allResults: existingJob.allResults,
        status: existingJob.status || 'draft',
      });
      const nextSnapshot = JSON.stringify({
        jobTitle: nextSavedJob.jobTitle,
        companyName: nextSavedJob.companyName,
        lastActiveView: nextSavedJob.lastActiveView,
        resultInputSignatures: nextSavedJob.resultInputSignatures,
        formData: nextSavedJob.formData,
        allResults: nextSavedJob.allResults,
        status: nextSavedJob.status,
      });

      if (existingSnapshot === nextSnapshot) {
        setSaveStatus('saved');
        return existingJob;
      }
    }

    setSavedJobs((prev) => {
      const existingIndex = prev.findIndex((job) => job.id === nextJobId);
      if (existingIndex === -1) {
        return [nextSavedJob, ...prev];
      }

      return prev.map((job) => (job.id === nextJobId ? nextSavedJob : job));
    });
    setCurrentJobId(nextJobId);
    setJobMeta(resolvedMeta);
    setSaveStatus('saved');
    router.replace(
      nextSavedJob.lastActiveView
        ? `/job-matcher?jobId=${nextJobId}&section=${nextSavedJob.lastActiveView}`
        : `/job-matcher?jobId=${nextJobId}`,
      { scroll: false }
    );

    if (showToast) {
      toast({
        title: existingJob
          ? 'Application Updated'
          : user
            ? 'Application Saved to Tracker!'
            : 'Application Saved Locally!',
        description: (
          <div className="mt-1 flex flex-col gap-3">
            <p className="text-sm">
              &quot;{nextSavedJob.jobTitle}&quot; has been saved
              {user ? ' to your application pipeline' : ' in this browser and will sync after login'}.
            </p>
            <Button asChild variant="secondary" size="sm" className="w-fit h-8 px-3 text-xs">
              <Link href={`/admin?from=build&jobId=${nextSavedJob.id}${nextSavedJob.lastActiveView ? `&section=${nextSavedJob.lastActiveView}` : ''}`}>Go to Application Tracker</Link>
            </Button>
          </div>
        ),
      });
    }

    return nextSavedJob;
  }, [activeView, allResults, currentJobId, formMethods, getFallbackJobMeta, jobMeta, resultInputSignatures, router, savedJobs, setSavedJobs, toast, user]);

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
        await upsertCurrentJob({ showToast: true });
      });
    });
  };

  const handleLoadJob = (job: SavedJob) => {
    // Map legacy 'bio' to 'workRepository' if needed
    const formData = {
      ...job.formData,
      workRepository: job.formData.workRepository || (job.formData as any).bio || '',
    };
    formMethods.reset(formData);
    setAllResults(job.allResults);
    setCurrentJobId(job.id);
    setJobMeta({
      jobTitle: job.jobTitle,
      companyName: job.companyName,
    });
    setResultInputSignatures(
      job.resultInputSignatures ||
        buildResultInputSignatures(formData, job.allResults)
    );
    const restoredView = resolveSavedJobView(job, activeSectionParam);
    setActiveView(restoredView);
    setSaveStatus('saved');
    suppressNextOutputScrollRef.current = true;
    setView('build');
    scrollPageToTop();
    router.replace(`/job-matcher?jobId=${job.id}&section=${restoredView}`, { scroll: false });
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

  useEffect(() => {
    if (
      isInitialFormLoad ||
      isGenerating ||
      isGeneratingAll ||
      Object.keys(allResults).length === 0 ||
      !watchedJobDescription?.trim() ||
      !watchedWorkRepository?.trim()
    ) {
      if (Object.keys(allResults).length === 0) {
        setSaveStatus('idle');
      }
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSaveStatus('pending');
    autoSaveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saving');
      void upsertCurrentJob();
    }, 900);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = null;
      }
    };
  }, [
    allResults,
    isGenerating,
    isGeneratingAll,
    isInitialFormLoad,
    upsertCurrentJob,
    watchedJobDescription,
    watchedQuestions,
    watchedWorkRepository,
    activeView,
  ]);

  useEffect(() => {
    if (view !== 'build' || !currentJobId || activeView === 'none') {
      return;
    }

    if (jobId === currentJobId && activeSectionParam === activeView) {
      return;
    }

    router.replace(`/job-matcher?jobId=${currentJobId}&section=${activeView}`, { scroll: false });
  }, [activeSectionParam, activeView, currentJobId, jobId, router, view]);

  const jobDescription = watchedJobDescription || '';
  const workRepository = watchedWorkRepository || '';

  const getLastGeneratedOutput = (): string => {
    if (activeView === 'none' || !allResults[activeView]) return '';
    try {
      return JSON.stringify(allResults[activeView], null, 2);
    } catch {
      return '';
    }
  };

  const selectedView: GenerationType = activeView === 'none' ? 'deepAnalysis' : activeView;
  const hasAnyResults = Object.keys(allResults).length > 0;
  const trackerHref = view === 'build'
    ? currentJobId
      ? `/admin?from=build&jobId=${currentJobId}&section=${selectedView}`
      : `/admin?from=build&section=${selectedView}`
    : '/admin';
  const buildSections: Array<{
    generationType: GenerationType;
    icon: React.ElementType;
    label: string;
    description: string;
    locked?: boolean;
    lockedMessage?: string;
  }> = [
    {
      generationType: 'deepAnalysis',
      icon: Lightbulb,
      label: 'Fit Summary',
      description: 'See how your background lines up with the role before you tailor anything else.',
    },
    {
      generationType: 'cv',
      icon: Briefcase,
      label: 'Resume',
      description: 'Create a role-specific resume built from your Work Repository.',
    },
    {
      generationType: 'coverLetter',
      icon: FileText,
      label: 'Cover Letter',
      description: 'Draft a tailored cover letter that connects your experience to the job.',
    },
    {
      generationType: 'qAndA',
      icon: MessageSquareMore,
      label: 'Answers',
      description: 'Prepare for application questions and interview follow-ups.',
      locked: !watchedQuestions?.trim(),
      lockedMessage: 'Add questions in Prepare to unlock',
    },
  ];
  const selectedSection = buildSections.find((section) => section.generationType === selectedView) || buildSections[0];
  const currentFormValues = {
    jobDescription,
    workRepository,
    questions: watchedQuestions || '',
  };
  const staleSections = buildSections.reduce<Record<GenerationType, boolean>>((acc, section) => {
    const existingSignature = resultInputSignatures[section.generationType];
    acc[section.generationType] = Boolean(
      allResults[section.generationType] &&
      existingSignature &&
      existingSignature !== getGenerationInputSignature(currentFormValues, section.generationType)
    );
    return acc;
  }, {
    coverLetter: false,
    cv: false,
    deepAnalysis: false,
    qAndA: false,
  });
  const recommendedSection = !allResults.deepAnalysis
    ? buildSections.find((section) => section.generationType === 'deepAnalysis')
    : !allResults.cv
      ? buildSections.find((section) => section.generationType === 'cv')
      : !allResults.coverLetter
        ? buildSections.find((section) => section.generationType === 'coverLetter')
        : watchedQuestions?.trim() && !allResults.qAndA
          ? buildSections.find((section) => section.generationType === 'qAndA')
          : null;
  const recommendedAction = recommendedSection
    ? {
        title: recommendedSection.label,
        description: recommendedSection.description,
        cta:
          recommendedSection.generationType === 'deepAnalysis'
            ? 'Start with Fit Summary'
            : `Create ${recommendedSection.label}`,
        onClick: () => handleGeneration(recommendedSection.generationType),
      }
    : !watchedQuestions?.trim()
      ? {
          title: 'Unlock Answers',
          description: 'Go back to Prepare and add application questions if you want tailored written answers and interview prep.',
          cta: 'Add Questions in Prepare',
          onClick: () => setView('prepare'),
        }
      : {
          title: 'Everything Core Is Ready',
          description: 'Your main materials are ready. Move this application through the tracker or refine any section in place.',
          cta: 'Open Tracker',
          onClick: () => router.push(trackerHref),
        };
  const readySections = buildSections.filter((section) => !!allResults[section.generationType]).map((section) => section.label);
  const coachPrompts = [
    'What should I do first for this role?',
    'Improve my work repository for this job',
    readySections.length > 0
      ? `I already have ${readySections.join(', ')}. What should I work on next?`
      : 'Create the best next document for me',
  ];

  const openCoach = (message?: string | { message: string; displayMessage?: string }) => {
    setIsCoPilotSidebarOpen(true);
    if (message) {
      handleCoPilotSubmit(message);
    }
  };

  const ActionButton = ({
      generationType,
      icon: Icon,
      label,
      description,
      locked = false,
      lockedMessage,
      recommended = false,
      stale = false,
  }: {
      generationType: GenerationType,
      icon: React.ElementType,
      label: string,
      description: string,
      locked?: boolean,
      lockedMessage?: string,
      recommended?: boolean
      stale?: boolean
  }) => {
      const hasResult = !!allResults[generationType];
      const isGeneratingThis = isGenerating && activeView === generationType;
      const isSelected = selectedView === generationType;
      return (
      <Card
          onClick={() => !locked && handleGeneration(generationType)}
          data-active={isSelected}
          data-locked={locked}
          className={cn(
            'relative overflow-hidden transition-all duration-300 bg-card/80 border-muted-foreground/10',
            locked ? 'opacity-60 cursor-not-allowed bg-muted/30 grayscale' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
            'data-[active=true]:bg-primary/5 data-[active=true]:border-primary/50 data-[active=true]:shadow-primary/10',
            recommended && !locked && 'border-primary/30 bg-primary/5',
            stale && !locked && 'border-amber-500/30 bg-amber-500/5'
          )}
      >
        <div className="flex items-start gap-4 p-4 lg:p-5">
          <div className={cn(
            'flex h-11 w-11 items-center justify-center rounded-2xl transition-colors',
            locked ? "bg-muted text-muted-foreground" :
            isSelected ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground",
            hasResult && !isSelected && !locked && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          )}>
            {locked ? <Lock className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="flex flex-col flex-1 text-left gap-1">
            <span className={cn(
                'font-semibold text-sm transition-colors',
                locked ? 'text-muted-foreground' : 'text-foreground'
            )}>{label}</span>
            {recommended && !locked ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                Recommended next
              </span>
            ) : null}
            {stale && !locked ? (
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">
                Needs refresh
              </span>
            ) : null}
            <span className="text-sm text-muted-foreground">{description}</span>
            {hasResult && !locked && !stale ? <span className="pt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Open saved result</span> : null}
            {locked && lockedMessage ? <span className="pt-1 text-[11px] font-semibold text-rose-500 line-clamp-2">{lockedMessage}</span> : null}
          </div>
          {isGeneratingThis && (
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
                Prepare and build tailored applications
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
                <Link href={trackerHref}>
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
                      <Link href={trackerHref}>
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
          <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
            {[
              { key: 'prepare', label: '1. Prepare', description: 'Add the job and your background.' },
              { key: 'build', label: '2. Build Your Application', description: 'Create, open, and refine each section.' },
            ].map((step) => {
              const isActive = view === step.key;
              const isComplete = step.key === 'prepare' && view === 'build';

              return (
                <div
                  key={step.key}
                  className={cn(
                    'rounded-2xl border px-4 py-3 transition-colors',
                    isActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/10 bg-card/60',
                    isComplete && 'border-emerald-500/20 bg-emerald-500/5'
                  )}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {isComplete ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : null}
                    <span>{step.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>

          {view === 'prepare' ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-500">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Prepare Your Inputs</h2>
                <p className="mt-2 text-muted-foreground">
                  Start by adding the target job description and your reusable Work Repository. Once those are ready, continue into Build Your Application.
                </p>
              </div>

              <InputForm isInitialLoading={isInitialFormLoad} />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Required to continue: Job Description and Work Repository.
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full sm:w-auto">
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
                          This will permanently clear the job description, Work Repository, and all generated content. This action cannot be undone.
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

                  <Button size="lg" onClick={handleContinueToBuild} className="w-full sm:w-auto">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-in fade-in duration-500">
              <div className="flex flex-col gap-4 rounded-3xl border bg-card p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Stage 2</span>
                    {jobMeta ? <span className="rounded-full bg-muted px-2 py-1 normal-case tracking-normal text-foreground">{jobMeta.jobTitle} at {jobMeta.companyName}</span> : null}
                    {hasAnyResults ? (
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 normal-case tracking-normal',
                          saveStatus === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : saveStatus === 'saving' || saveStatus === 'pending'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        )}
                      >
                        {saveStatus === 'saving'
                          ? 'Saving changes...'
                          : saveStatus === 'pending'
                            ? 'Saving soon...'
                            : saveStatus === 'error'
                              ? 'Save issue'
                              : 'All changes saved'}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Build Your Application</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Using the role and background you prepared. Results are saved automatically as you build.
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
                  <Button variant="ghost" size="sm" onClick={() => setView('prepare')} className="w-full sm:w-auto">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Prepare
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSaveJob}
                    disabled={isSaving || !hasAnyResults}
                    aria-label="Save Application"
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Now
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href={trackerHref}>
                      <List className="mr-2 h-4 w-4" /> View Tracker
                    </Link>
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-accent/10">
                <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">AI Coach</h3>
                        <p className="text-sm text-muted-foreground">
                          Need help deciding what to do next? Ask for guidance, ask for improvements, or let the coach build the next best section with you.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {coachPrompts.map((prompt) => (
                        <Button
                          key={prompt}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start rounded-full bg-background/80 text-left sm:w-auto"
                          onClick={() => openCoach(prompt)}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Button size="lg" className="w-full min-w-[180px] sm:w-auto" onClick={() => openCoach()}>
                      <Bot className="mr-2 h-4 w-4" />
                      Open AI Coach
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
                <div className="space-y-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <div className="space-y-3 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                          Recommended next step
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-foreground">
                          {recommendedAction.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {recommendedAction.description}
                        </p>
                      </div>
                      <Button className="w-full" onClick={recommendedAction.onClick}>
                        {recommendedAction.cta}
                      </Button>
                    </div>
                  </Card>
                  <Button
                    onClick={handleGenerateAll}
                    disabled={isGeneratingAll || isGenerating}
                    className="h-14 w-full justify-center rounded-2xl bg-gradient-to-r from-primary to-accent px-8 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90"
                  >
                    {isGeneratingAll ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating everything...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create Everything for Me
                      </>
                    )}
                  </Button>

                  <div className="space-y-3">
                    {buildSections.map((section) => (
                      <ActionButton
                        key={section.generationType}
                        generationType={section.generationType}
                        icon={section.icon}
                        label={section.label}
                        description={section.description}
                        locked={section.locked}
                        lockedMessage={section.lockedMessage}
                        recommended={section.generationType === recommendedSection?.generationType}
                        stale={staleSections[section.generationType]}
                      />
                    ))}
                  </div>
                </div>

                <div ref={outputRef} className="space-y-4">
                  {!allResults[selectedView] && !generationError && !(isGenerating && activeView === selectedView) ? (
                    <Card className="min-h-[320px] border-dashed bg-card/60 sm:min-h-[420px]">
                      <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[420px] sm:px-8 sm:py-12">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <selectedSection.icon className="h-7 w-7" />
                        </div>
                        <h3 className="mt-5 text-2xl font-semibold text-foreground">{selectedSection.label}</h3>
                        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                          {selectedSection.description}
                        </p>
                        {selectedView === 'deepAnalysis' ? (
                          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                            Start here if you want a quick read on your fit before tailoring your resume or cover letter.
                          </p>
                        ) : null}
                        <Button className="mt-6 w-full sm:w-auto" onClick={() => handleGeneration(selectedView)}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Create {selectedSection.label}
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <OutputView
                      activeView={selectedView}
                      setActiveView={setActiveView}
                      allResults={allResults}
                      setAllResults={setAllResults}
                      isGenerating={isGenerating || isGeneratingAll}
                      generationError={generationError}
                      onRetry={() => handleGeneration(selectedView, { force: true })}
                      showSectionSwitcher={false}
                      isActiveViewStale={staleSections[selectedView]}
                      headerDescription={selectedSection.description}
                      onCoachRequest={(message) => {
                        const requirementLine = message
                          .split('\n')
                          .find((line) => line.startsWith('Requirement: '));
                        const requirementLabel = requirementLine?.replace('Requirement: ', '') || 'this gap';

                        openCoach({
                          message,
                          displayMessage: `Help me close this gap: ${requirementLabel}`,
                        });
                      }}
                      headerActions={allResults[selectedView] ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => handleGeneration(selectedView, { force: true })}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {staleSections[selectedView] ? 'Refresh with Current Inputs' : 'Regenerate'}
                        </Button>
                      ) : null}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </FormProvider>
      </main>


      
      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Free Queries Limit Reached</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve used all your free queries for this session. Please log in or sign up to continue generating unlimited content and save your work.
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
