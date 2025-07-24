"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  JobApplicationSchema, 
  type JobApplicationData, 
} from "@/lib/schemas";
import { generateAction, AllGenerationResults } from "@/app/actions";
import { InputForm } from "./input-form";
import { OutputView } from "./output-view";

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

export type GenerationType = 'coverLetter' | 'cv' | 'deepAnalysis' | 'qAndA';
export type ActiveView = GenerationType | 'none';

/**
 * Main application component for JobSpark. It orchestrates the user interface,
 * manages state for form inputs and AI-generated results, and handles the
 * logic for calling server actions.
 *
 * @returns {JSX.Element} The rendered JobSpark application.
 */
export function JobSparkApp(): JSX.Element {
  const [isGenerating, startGenerating] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);
  
  const formMethods = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: "", bio: "", questions: "" },
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        formMethods.reset({ 
            jobDescription: parsedData.jobDescription || "", 
            bio: parsedData.bio || "",
            questions: parsedData.questions || ""
        });
      }
    } catch (e) {
      console.error("Failed to load or parse data from localStorage", e);
    }
  }, [formMethods]);

  // Save to localStorage on change
  useEffect(() => {
    const subscription = formMethods.watch((value) => {
       try {
         const dataToSave = { 
             jobDescription: value.jobDescription, 
             bio: value.bio,
             questions: value.questions
        };
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
       } catch (e) {
         console.error("Failed to save data to localStorage", e);
       }
    });
    return () => subscription.unsubscribe();
  }, [formMethods.watch]);
  
  /**
   * Handles the request to generate a new piece of content.
   * @param {GenerationType} generationType - The type of content to generate.
   */
  const handleGeneration = (generationType: GenerationType) => {
    formMethods.trigger(['jobDescription', 'bio']).then(isValid => {
        if (!isValid) {
            toast({ variant: "destructive", title: "Please fill out both Job Description and Bio fields."});
            return;
        }

        if (generationType === 'qAndA' && !formMethods.getValues('questions')) {
            toast({ variant: "destructive", title: "Please provide specific questions to answer." });
            return;
        }
        
        const data = { ...formMethods.getValues(), generationType };

        setActiveView(generationType);
        setGenerationError(null);
        outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Optimistically clear previous results for this type to show loading skeleton
        setAllResults(prev => {
            const newResults = {...prev};
            delete newResults[generationType];
            return newResults;
        });

        startGenerating(async () => {
            const response = await generateAction(data);
            if (response.success) {
                setAllResults(prev => ({...prev, [generationType]: response.data}));
            } else {
                setGenerationError(response.error);
                // The error will be displayed in the OutputView component
            }
        });
    });
  }
  
  /**
   * Clears all form inputs and generated results.
   */
  const handleClear = () => {
    formMethods.reset({ jobDescription: "", bio: "", questions: "" });
    setAllResults({});
    setActiveView('none');
    setGenerationError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear data from localStorage", e);
    }
  };
  
  const { jobDescription, bio } = formMethods.getValues();

  /**
   * Gets the last generated output as a string for feedback submission.
   * @returns {string} The stringified version of the last generated output.
   */
  const getLastGeneratedOutput = (): string => {
      if (activeView === 'none' || !allResults[activeView]) return "";
      try {
        return JSON.stringify(allResults[activeView], null, 2);
      } catch {
        return "";
      }
  };

  const renderInitialView = () => (
    <Card className="flex min-h-[400px] items-center justify-center">
      <CardContent className="p-4 text-center">
        <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          Your generated content will appear here.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <FormProvider {...formMethods}>
      <div className="flex flex-col gap-8">
        {/* Input Section */}
        <InputForm
          isGenerating={isGenerating}
          activeView={activeView}
          onGeneration={handleGeneration}
          onClear={handleClear}
          jobDescription={jobDescription}
          bio={bio}
          lastGeneratedOutput={getLastGeneratedOutput()}
        />

        {/* Output Section */}
        <div ref={outputRef}>
          {activeView === 'none' ? renderInitialView() : (
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
  );
}
