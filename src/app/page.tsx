
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Sparkles, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState, useTransition } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { AllGenerationResults, generateAction } from '@/app/actions';
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
import { useToast } from '@/hooks/use-toast';
import type { JobApplicationData } from '@/lib/schemas';
import { JobApplicationSchema } from '@/lib/schemas';
import { ActiveView, GenerationType } from '@/components/job-spark-app';
import { Skeleton } from '@/components/ui/skeleton';

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

export default function Home() {
  const [isGenerating, startGenerating] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);

  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: '', bio: '', questions: '' },
  });

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
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
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (e) {
        console.error('Failed to save data to localStorage', e);
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods.watch]);

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
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear data from localStorage', e);
    }
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
    <div className="flex w-full flex-col bg-muted/20">
      <header className="sticky top-0 z-10 w-full border-b border-primary-foreground/20 bg-primary px-4 py-4 sm:px-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <JobSparkLogo className="h-10 w-10 text-primary-foreground" />
            <div className="flex flex-col">
              <h1 className="font-headline text-2xl font-bold text-primary-foreground md:text-3xl">
                JobSpark
              </h1>
              <p className="text-xs text-primary-foreground/80">
                Allow AI to boost your job application productivity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleClear}
              aria-label="Clear All"
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <FeedbackDialog
              jobDescription={jobDescription}
              bio={bio}
              lastGeneratedOutput={getLastGeneratedOutput()}
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" aria-label="API Key">
                  <KeyRound className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      Custom API Key
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Use your own Gemini API key for requests.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">Gemini API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your Gemini API key"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
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
