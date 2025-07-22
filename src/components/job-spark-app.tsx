
"use client";

import React, { useState, useTransition, useEffect, useCallback, Fragment } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, CheckCircle2, XCircle, Wand2, Edit, Save, Trash2, FileText, Briefcase, Lightbulb, MessageSquareMore, AlertTriangle } from "lucide-react";
import Markdown from 'react-markdown';
import { compiler } from 'markdown-to-jsx';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  JobApplicationSchema, 
  ReviseResponseSchema,
  type JobApplicationData, 
  type ReviseResponseData,
} from "@/lib/schemas";
import { generateAction, reviseAction, AllGenerationResults } from "@/app/actions";
import { DeepAnalysisOutput } from "@/ai/flows";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

type GenerationType = 'coverLetter' | 'cv' | 'deepAnalysis';
type ActiveView = GenerationType | 'none';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function SectionSkeleton() {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full mt-2" />
            <Skeleton className="h-4 w-full mt-2" />
        </div>
      </div>
    );
}

function CopyButton({ textToCopy, className }: { textToCopy: string, className?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    const plainText = textToCopy.replace(/\*\*/g, '');

    try {
      const reactElement = compiler(textToCopy, { forceBlock: true });
      const tempDiv = document.createElement('div');
      
      const ReactDOMClient = (await import('react-dom/client'));
      const root = ReactDOMClient.createRoot(tempDiv);
      
      await new Promise<void>(resolve => {
        // This is a bit of a hack to wait for the render to complete.
        // In a real-world scenario, you'd want a more robust solution.
        root.render(
          <React.Fragment>
            {reactElement}
            <img src="" style={{display: 'none'}} onLoad={() => resolve()} />
          </React.Fragment>
        );
      });

      const html = tempDiv.innerHTML;
      
      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });
      
      const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText,
      });

      await navigator.clipboard.write([clipboardItem]);
      setIsCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy rich text, falling back to plain text:", err);
      navigator.clipboard.writeText(plainText).then(() => {
        setIsCopied(true);
        toast({ title: "Copied as plain text!" });
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };


  return (
    <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy text" className={className}>
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function GeneratedResponse({ initialValue, onValueChange, generationType, onRevision }: { initialValue: string, onValueChange: (value: string) => void, generationType: 'coverLetter' | 'cv', onRevision: (data: ReviseResponseData) => Promise<void> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);
  const debouncedValue = useDebounce(initialValue, 500);

  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    onValueChange(localValue);
    setIsEditing(false);
  };
  
  return (
    <div className="relative">
      {isEditing ? (
        <>
          <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="min-h-[250px] bg-background"
            aria-label="Generated Response"
          />
           <Button variant="ghost" size="icon" onClick={handleSave} className="absolute top-2 right-2">
            <Save className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="prose prose-sm max-w-none p-4 min-h-[150px] rounded-md border bg-background whitespace-pre-wrap">
             <Markdown>{localValue}</Markdown>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="absolute top-2 right-2">
            <Edit className="h-4 w-4" />
          </Button>
        </>
      )}
      <RevisionForm
        currentResponse={debouncedValue}
        generationType={generationType}
        onRevision={onRevision}
      />
    </div>
  );
}


function DeepAnalysisView({ deepAnalysis }: { deepAnalysis: DeepAnalysisOutput }) {
  const renderDetails = (details?: string[]) => {
    if (!details || details.length === 0) {
      return null;
    }
    return (
        <ul className="prose prose-sm max-w-none list-disc pl-5 space-y-2">
          {details.map((item, index) => (
            <li key={index} className="ml-5">
                <Markdown components={{ p: Fragment }}>{item}</Markdown>
            </li>
          ))}
        </ul>
    );
  };

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Job Summary
          </CardTitle>
          <CardDescription className="prose-sm">An expert summary of the role's core requirements.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap">
            <Markdown>{deepAnalysis.jobSummary}</Markdown>
          </div>
        </CardContent>
      </Card>
      
      {deepAnalysis.qAndA?.questionsFound && (
          <QAndAView qAndA={deepAnalysis.qAndA} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <span className="text-green-600">Key Strengths</span>
          </CardTitle>
          <CardDescription className="prose-sm">How your bio aligns with the job requirements.</CardDescription>
        </CardHeader>
        <CardContent>
            {renderDetails(deepAnalysis.keyStrengths)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-red-500" />
            <span className="text-red-600">Gaps</span>
          </CardTitle>
          <CardDescription className="prose-sm">Areas where your bio is missing required experience.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderDetails(deepAnalysis.gaps)}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-yellow-500" />
            <span className="text-yellow-600">Improvement Areas</span>
          </CardTitle>
           <CardDescription className="prose-sm">Actionable advice to better present your experience.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderDetails(deepAnalysis.improvementAreas)}
        </CardContent>
      </Card>
    </div>
  )
}

function QAndAView({ qAndA }: { qAndA: NonNullable<DeepAnalysisOutput['qAndA']> }) {
  if (!qAndA.questionsFound) {
    return null;
  }

  const allAnswers = qAndA.qaPairs.map(p => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n');
  const missingAnswersCount = qAndA.qaPairs.filter(p => p.answer === '[Answer not found in bio]').length;
  const NOT_FOUND_STRING = '[Answer not found in bio]';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
                <MessageSquareMore className="h-6 w-6 text-primary" />
                Q&A
            </CardTitle>
            <CardDescription className="prose-sm">Answers to questions found in the job description.</CardDescription>
        </div>
        <CopyButton textToCopy={allAnswers} />
      </CardHeader>
      <CardContent className="space-y-6">
        {missingAnswersCount > 0 && (
          <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Missing Information</AlertTitle>
              <AlertDescription className="prose-sm">
                  {missingAnswersCount} question{missingAnswersCount > 1 ? 's' : ''} could not be answered based on your bio. These are highlighted below.
              </AlertDescription>
          </Alert>
        )}
        <div className="space-y-4">
            {qAndA.qaPairs.map((pair, index) => (
                <div key={index} className="p-4 rounded-md border bg-muted/50 relative">
                <p className="font-semibold text-primary mb-2 pr-10 prose-sm">{pair.question}</p>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                    {pair.answer === NOT_FOUND_STRING ? (
                        <span className="text-destructive">{pair.answer}</span>
                    ) : (
                        <Markdown>{pair.answer}</Markdown>
                    )}
                </div>
                {pair.answer !== NOT_FOUND_STRING && <CopyButton textToCopy={pair.answer} className="absolute top-2 right-2" />}
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}


export function JobSparkApp() {
  const [isGenerating, startGenerating] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  
  const form = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(JobApplicationSchema.omit({ generationType: true })),
    defaultValues: { jobDescription: "", bio: "" },
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        form.reset({ jobDescription: parsedData.jobDescription || "", bio: parsedData.bio || "" });
      }
    } catch (e) {
      console.error("Failed to load or parse data from localStorage", e);
    }
  }, [form]);

  // Save to localStorage on change
  useEffect(() => {
    const subscription = form.watch((value) => {
       try {
         const dataToSave = { jobDescription: value.jobDescription, bio: value.bio };
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
       } catch (e) {
         console.error("Failed to save data to localStorage", e);
       }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleGeneration = (generationType: GenerationType) => {
    form.trigger().then(isValid => {
        if (!isValid) {
            toast({ variant: "destructive", title: "Please fill out both fields."});
            return;
        }
        
        const data = { ...form.getValues(), generationType };

        setActiveView(generationType);
        setGenerationError(null);

        // If data for this view already exists, we don't need to fetch it again.
        if (allResults[generationType]) {
            return;
        }

        startGenerating(async () => {
            const response = await generateAction(data);
            if (response.success) {
                setAllResults(prev => ({...prev, [generationType]: response.data}));
            } else {
                setGenerationError(response.error);
                toast({ variant: "destructive", title: "Generation Failed", description: response.error });
            }
        });
    });
  }
  
  const handleManualEdit = (newValue: string, generationType: 'coverLetter' | 'cv') => {
      setAllResults(prev => ({
          ...prev, 
          [generationType]: { responses: newValue }
      }));
  };

  const handleRevision = async (data: ReviseResponseData) => {
    const result = await reviseAction(data);
    if (result.success) {
      const { generationType } = data;
      const newResponseText = result.data.responses;
      setAllResults(prev => ({ ...prev, [generationType]: { responses: newResponseText } }));
    } else {
      toast({
        variant: "destructive",
        title: "Revision Failed",
        description: result.error,
      });
    }
  };


  const handleClear = () => {
    form.reset({ jobDescription: "", bio: "" });
    setAllResults({});
    setActiveView('none');
    setGenerationError(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear data from localStorage", e);
    }
  };
  
  const coverLetterResponse = allResults.coverLetter?.responses ?? "";
  const cvResponse = allResults.cv?.responses ?? "";

  const renderActiveView = () => {
      if (isGenerating && !allResults[activeView]) {
        return <SectionSkeleton />;
      }
      if (generationError && activeView !== 'none' && !allResults[activeView]) {
          return (
             <Card>
                <CardContent className="p-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Generation Failed</AlertTitle>
                        <AlertDescription>{generationError}</AlertDescription>
                    </Alert>
                </CardContent>
             </Card>
          );
      }

      switch (activeView) {
          case 'coverLetter':
            if (!allResults.coverLetter) return null;
            return (
                <GeneratedResponse 
                    initialValue={coverLetterResponse}
                    onValueChange={(val) => handleManualEdit(val, 'coverLetter')} 
                    generationType="coverLetter"
                    onRevision={handleRevision}
                />
            );
          case 'cv':
             if (!allResults.cv) return null;
             return (
                 <GeneratedResponse 
                    initialValue={cvResponse} 
                    onValueChange={(val) => handleManualEdit(val, 'cv')}
                    generationType="cv"
                    onRevision={handleRevision}
                />
             );
          case 'deepAnalysis':
            if (!allResults.deepAnalysis) return null;
            return <DeepAnalysisView deepAnalysis={allResults.deepAnalysis} />;
          default:
            return (
                 <Card className="flex items-center justify-center min-h-[400px]">
                    <CardContent className="p-4 text-center">
                        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground">Your generated content will appear here.</p>
                    </CardContent>
                </Card>
            );
      }
  };

  const VIEW_CONFIG: Record<GenerationType, { title: string; icon: React.ReactNode }> = {
      coverLetter: { title: "Cover Letter", icon: <FileText className="h-5 w-5" /> },
      cv: { title: "Curriculum Vitae (CV)", icon: <Briefcase className="h-5 w-5" /> },
      deepAnalysis: { title: "Deep Analysis", icon: <Lightbulb className="h-5 w-5" /> },
  };

  return (
    <FormProvider {...form}>
      <div className="grid md:grid-cols-2 gap-8 w-full p-4 sm:p-6 md:p-8">
        {/* Input Column */}
        <div className="flex flex-col gap-8">
          <Card className="bg-card/80 backdrop-blur-sm sticky top-24">
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription className="prose-sm">
                Provide your info, then choose what to generate.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste the full job description here. The AI will analyze it to find the key requirements."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Bio / Resume</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide your detailed bio or paste your resume. The more details, the better the result!"
                            className="min-h-[200px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="prose-sm">
                          This will be compared against the job description to find matches and gaps.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {/* Application Materials */}
                  <div className="space-y-2">
                      <h3 className="font-semibold text-center text-sm text-muted-foreground">Application Materials</h3>
                      <Button onClick={() => handleGeneration('coverLetter')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'coverLetter' ? <Loader2 className="animate-spin" /> : <FileText />}
                          Generate Letter
                      </Button>
                      <Button onClick={() => handleGeneration('cv')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'cv' ? <Loader2 className="animate-spin" /> : <Briefcase />}
                          Generate CV
                      </Button>
                  </div>
                  {/* Job Insights */}
                  <div className="space-y-2">
                      <h3 className="font-semibold text-center text-sm text-muted-foreground">Job Insights</h3>
                      <Button onClick={() => handleGeneration('deepAnalysis')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'deepAnalysis' ? <Loader2 className="animate-spin" /> : <Lightbulb />}
                          Generate Analysis
                      </Button>
                  </div>
              </div>
              <Separator />
              <Button type="button" variant="outline" onClick={handleClear} className="w-full sm:w-auto">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Output Column */}
        <div className="flex flex-col gap-4">
          <Card>
              <CardHeader>
                  <div className="flex justify-between items-center">
                      {activeView !== 'none' ? (
                          <CardTitle className="flex items-center gap-2">{VIEW_CONFIG[activeView].icon} {VIEW_CONFIG[activeView].title}</CardTitle>
                      ) : (
                          <CardTitle>Output</CardTitle>
                      )}
                      <div className="flex items-center gap-1">
                          {(Object.keys(allResults) as GenerationType[]).map(key => (
                              <Button 
                                  key={key}
                                  variant={activeView === key ? 'default' : 'ghost'} 
                                  size="icon"
                                  onClick={() => setActiveView(key)}
                                  aria-label={`View ${VIEW_CONFIG[key].title}`}
                                  disabled={isGenerating && !allResults[key]}
                              >
                                  {VIEW_CONFIG[key].icon}
                              </Button>
                          ))}
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  {renderActiveView()}
              </CardContent>
          </Card>
        </div>
      </div>
    </FormProvider>
  );
}

function RevisionForm({ currentResponse, generationType, onRevision }: { currentResponse: string, generationType: 'cv' | 'coverLetter', onRevision: (data: ReviseResponseData) => Promise<void> }) {
  const [isRevising, startRevising] = useTransition();
  const form = useFormContext<Omit<JobApplicationData, 'generationType'>>();

  const revisionForm = useForm<ReviseResponseData>({
    resolver: zodResolver(ReviseResponseSchema),
    defaultValues: {
      revisionComments: "",
      // These will be updated via useEffect
      jobDescription: form.getValues().jobDescription,
      bio: form.getValues().bio,
      originalResponse: currentResponse,
      generationType: generationType,
    },
  });
  
  useEffect(() => {
      revisionForm.setValue('jobDescription', form.getValues().jobDescription);
      revisionForm.setValue('bio', form.getValues().bio);
      revisionForm.setValue('originalResponse', currentResponse);
  }, [currentResponse, form, revisionForm]);

  async function onRevise(data: ReviseResponseData) {
    startRevising(async () => {
        await onRevision(data);
        revisionForm.reset({ ...data, revisionComments: "" });
    });
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      revisionForm.handleSubmit(onRevise)();
    }
  };

  return (
    <Card className="mt-4 bg-muted/50">
      <CardHeader>
        <CardTitle className="text-xl">Revise Output</CardTitle>
        <CardDescription className="prose-sm">Not quite right? Tell the AI how to improve the response.</CardDescription>
      </CardHeader>
      <CardContent>
          <form onSubmit={revisionForm.handleSubmit(onRevise)} className="space-y-4">
            <FormField
              control={revisionForm.control}
              name="revisionComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Make it more formal.' or 'Emphasize my experience with project management tools.'"
                      className="min-h-[100px] bg-background"
                      {...field}
                      onKeyDown={handleKeyDown}
                      disabled={isRevising}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isRevising || !revisionForm.formState.isDirty || !revisionForm.formState.isValid} className="w-full sm:w-auto">
              {isRevising ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Revise
            </Button>
          </form>
      </CardContent>
    </Card>
  )
}

    