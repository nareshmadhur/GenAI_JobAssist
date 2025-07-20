
"use client";

import React, { useState, useTransition, useEffect, useCallback, Fragment } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, Info, CheckCircle2, XCircle, Wand2, Edit, Save, Trash2, FileText, Briefcase, Lightbulb, MessageSquareMore, AlertTriangle } from "lucide-react";
import Markdown from 'react-markdown';
import { compiler } from 'markdown-to-jsx';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { generateInitialAction, generateSingleAction, reviseAction, AllGenerationResults } from "@/app/actions";
import { DeepAnalysisOutput, QAndAOutput } from "@/ai/flows";
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

type GenerationType = 'coverLetter' | 'cv' | 'deepAnalysis' | 'qAndA';

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

function OutputSkeletons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <Skeleton className="h-7 w-2/5" />
          </div>
          <Skeleton className="h-4 w-4/5 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-full mt-4 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <Skeleton className="h-7 w-2/5" />
          </div>
          <Skeleton className="h-4 w-4/5 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </CardContent>
      </Card>
    </div>
  );
}

function CopyButton({ textToCopy, className }: { textToCopy: string, className?: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    // For plain text, remove the markdown bold characters.
    const plainText = textToCopy.replace(/\*\*/g, '');

    try {
      // For rich text, convert markdown to a React element, then to an HTML string.
      // This is a simplified approach. It won't work in a server component without a library like 'react-dom/server'.
      // In a client component, we can mount it to a hidden div to get the HTML.
      const reactElement = compiler(textToCopy, { forceBlock: true });
      const tempDiv = document.createElement('div');
      // Temporarily render to a hidden div to get HTML. This is a client-side trick.
      // Note: This relies on browser APIs.
      const ReactDOM = (await import('react-dom')).default;
      const root = ReactDOM.createRoot(tempDiv);
      root.render(reactElement);
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
      // Fallback to plain text if rich text copy fails.
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

function RevisionForm({ originalData, currentResponse, onRevisionComplete, generationType, isRevising }: { originalData: JobApplicationData, currentResponse: string, onRevisionComplete: (newResponse: any) => void, generationType: GenerationType, isRevising: boolean }) {
  const { toast } = useToast();
  
  const revisionForm = useForm<ReviseResponseData>({
    resolver: zodResolver(ReviseResponseSchema),
    defaultValues: {
      jobDescription: originalData.jobDescription,
      bio: originalData.bio,
      originalResponse: currentResponse,
      revisionComments: "",
      generationType: 'coverLetter', // default value
    },
  });
  
  useEffect(() => {
      revisionForm.reset({
          jobDescription: originalData.jobDescription,
          bio: originalData.bio,
          originalResponse: currentResponse,
          revisionComments: "",
          generationType,
      });
  }, [currentResponse, originalData.jobDescription, originalData.bio, generationType, revisionForm]);


  async function onRevise(data: ReviseResponseData) {
    onRevisionComplete(await reviseAction(data));
  }
  
  return (
    <Card className="mt-4 bg-muted/50">
      <CardHeader>
        <CardTitle className="text-xl">Revise Output</CardTitle>
        <CardDescription>Not quite right? Tell the AI how to improve the response.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...revisionForm}>
          <form onSubmit={revisionForm.handleSubmit(onRevise)} className="space-y-4">
            <FormField
              control={revisionForm.control}
              name="revisionComments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'Make it more formal.' or 'Mention my experience with project management tools.'"
                      className="min-h-[100px] bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isRevising} className="w-full sm:w-auto">
              {isRevising ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Revise
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}

function GeneratedResponse({ initialValue, onValueChange, isSaving, isSwitching }: { initialValue: string, onValueChange: (value: string) => void, isSaving: boolean, isSwitching: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    onValueChange(localValue);
    setIsEditing(false);
  };
  
  if (isSwitching) {
    return <OutputSkeletons />
  }

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
           <Button variant="ghost" size="icon" onClick={handleSave} className="absolute top-2 right-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
          </Button>
        </>
      ) : (
        <>
          <div className="prose prose-sm max-w-none p-4 min-h-[250px] rounded-md border bg-background whitespace-pre-wrap">
             <Markdown>{localValue}</Markdown>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="absolute top-2 right-2">
            <Edit className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

function DeepAnalysisView({ deepAnalysis }: { deepAnalysis: DeepAnalysisOutput }) {
  const renderDetails = (details?: string[]) => {
    if (!details) return null;
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
          <div className="prose prose-sm max-w-none">
            <Markdown>{deepAnalysis.jobSummary}</Markdown>
          </div>
        </CardContent>
      </Card>
      
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

function QAndAView({ qAndA, isSwitching }: { qAndA: QAndAOutput, isSwitching: boolean }) {
  if (isSwitching) return <OutputSkeletons />;
  if (!qAndA.questionsFound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquareMore className="h-6 w-6 text-primary" />
            Q&A
          </CardTitle>
          <CardDescription className="prose-sm">Answers to questions found in the job description.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="prose-sm">No explicit questions were found in the job description.</p>
        </CardContent>
      </Card>
    )
  }

  const allAnswers = qAndA.qaPairs.map(p => `Q: ${p.question}\nA: ${p.answer}`).join('\n\n');
  const missingAnswersCount = qAndA.qaPairs.filter(p => p.answer === '[Answer not found in bio]').length;
  const NOT_FOUND_STRING = '[Answer not found in bio]';

  return (
    <div className="space-y-6">
      {missingAnswersCount > 0 && (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Information</AlertTitle>
            <AlertDescription className="prose-sm">
                {missingAnswersCount} question{missingAnswersCount > 1 ? 's' : ''} could not be answered based on your bio. These are highlighted in red below.
            </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareMore className="h-6 w-6 text-primary" />
              Generated Answers
            </CardTitle>
            <CardDescription className="prose-sm">Answers for questions found in the job description.</CardDescription>
          </div>
          <CopyButton textToCopy={allAnswers} />
        </CardHeader>
        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  )
}

export function JobSparkApp() {
  const [isGenerating, startInitialGeneration] = useTransition();
  const [isSwitching, startSwitchingTab] = useTransition();
  const [isRevising, startRevising] = useTransition();

  const [allResults, setAllResults] = useState<AllGenerationResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<JobApplicationData | null>(null);

  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [activeTab, setActiveTab] = useState<GenerationType>('coverLetter');

  const debouncedEditableResponse = useDebounce(currentResponse, 500);

  const { toast } = useToast();
  
  const form = useForm<JobApplicationData>({
    resolver: zodResolver(JobApplicationSchema),
    defaultValues: {
      jobDescription: "",
      bio: "",
      generationType: 'coverLetter',
    },
  });

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        form.reset({ jobDescription: parsedData.jobDescription || "", bio: parsedData.bio || "", generationType: 'coverLetter' });
      }
    } catch (e) {
      console.error("Failed to load or parse data from localStorage", e);
    }
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
       if (name !== 'generationType') {
          try {
            const dataToSave = { jobDescription: value.jobDescription, bio: value.bio };
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
          } catch (e) {
            console.error("Failed to save data to localStorage", e);
          }
       }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = (data: JobApplicationData) => {
    setError(null);
    setAllResults(null);
    setCurrentResponse("");
    const generationType = data.generationType || 'coverLetter';
    setActiveTab(generationType);
    setLastSubmittedData({ ...data, generationType });

    startInitialGeneration(async () => {
      const response = await generateInitialAction({ ...data, generationType });
      if (response.success) {
        setAllResults(response.data);
        if (generationType === 'coverLetter' || generationType === 'cv') {
            const resultForTab = response.data[generationType];
            if (resultForTab && 'responses' in resultForTab) {
              setCurrentResponse(resultForTab.responses || "");
            }
        }
      } else {
        setError(response.error);
        toast({ variant: "destructive", title: "Generation Failed", description: response.error });
      }
    });
  }
  
  const onTabChange = (newTab: string) => {
    if (!lastSubmittedData || isSwitching) return;
    const newGenType = newTab as GenerationType;
    setActiveTab(newGenType);
    
    const existingResult = allResults?.[newGenType];
    if (existingResult) {
       if (newGenType === 'coverLetter' || newGenType === 'cv') {
         setCurrentResponse((existingResult as any).responses || "");
       }
       return;
    }

    startSwitchingTab(async () => {
      const result = await generateSingleAction({ ...lastSubmittedData, generationType: newGenType });
      if (result.success) {
          setAllResults(prev => ({ ...prev!, [newGenType]: result.data }));
          if (newGenType === 'coverLetter' || newGenType === 'cv') {
            setCurrentResponse((result.data as any).responses);
          }
      } else {
        toast({ variant: "destructive", title: "Failed to switch", description: result.error });
        setActiveTab(activeTab); // Revert on failure
      }
    });
  }

  const handleRevisionComplete = (result: any) => {
      startRevising(async () => {
        if (result.success) {
          const newResponseText = result.data.responses;
          setCurrentResponse(newResponseText);
          setAllResults(prev => ({...prev!, [activeTab]: { responses: newResponseText }}));
        } else {
           toast({
            variant: "destructive",
            title: "Revision Failed",
            description: result.error,
          });
        }
      });
  };

  const handleManualEdit = (newValue: string) => {
      setCurrentResponse(newValue);
      if (allResults && (activeTab === 'cv' || activeTab === 'coverLetter')) {
          setAllResults(prev => ({
              ...prev!, 
              [activeTab]: { responses: newValue }
          }));
      }
  };

  const handleClear = () => {
    form.reset({ jobDescription: "", bio: "" });
    setAllResults(null);
    setCurrentResponse("");
    setLastSubmittedData(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear data from localStorage", e);
    }
  };
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if ((event.altKey || event.metaKey) && event.key === 'Enter') {
        if (target.tagName !== 'TEXTAREA' || (target as HTMLTextAreaElement).form === form.control.formRef.current) {
            event.preventDefault();
            form.handleSubmit(onSubmit)();
        }
    }
  }, [form, onSubmit]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const isPending = isGenerating || isSwitching;

  const renderContent = () => {
    if (isPending) return <OutputSkeletons />;
  
    switch (activeTab) {
      case 'coverLetter':
      case 'cv':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {activeTab === 'cv' ? <Briefcase className="h-6 w-6 text-primary" /> : <FileText className="h-6 w-6 text-primary" />}
                    Your Tailored {activeTab === 'cv' ? 'CV' : 'Letter'}
                  </CardTitle>
                  <CardDescription className="prose-sm">An AI-generated draft for your review.</CardDescription>
                </div>
                <CopyButton textToCopy={currentResponse} />
              </CardHeader>
              <CardContent>
                <GeneratedResponse initialValue={currentResponse} onValueChange={handleManualEdit} isSaving={isRevising} isSwitching={isSwitching}/>
              </CardContent>
            </Card>
            {lastSubmittedData && (
              <RevisionForm 
                originalData={lastSubmittedData}
                currentResponse={debouncedEditableResponse} 
                onRevisionComplete={handleRevisionComplete}
                generationType={activeTab}
                isRevising={isRevising}
              />
            )}
          </>
        );
      case 'deepAnalysis':
        return allResults?.deepAnalysis ? <DeepAnalysisView deepAnalysis={allResults.deepAnalysis} /> : <OutputSkeletons />;
      case 'qAndA':
        return allResults?.qAndA ? <QAndAView qAndA={allResults.qAndA} isSwitching={isSwitching} /> : <OutputSkeletons />;
      default:
        return null;
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full p-4 sm:p-6 md:p-8">
      {/* Input Column */}
      <div className="flex flex-col gap-8">
        <Card className="bg-card/80 backdrop-blur-sm sticky top-24">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
            <CardDescription className="prose-sm">
              Select an output, provide your info, and let the AI work its magic.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="generationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Output</FormLabel>
                      <FormControl>
                        <Tabs
                          defaultValue={field.value}
                          onValueChange={(value) => field.onChange(value as GenerationType)}
                          className="w-full"
                        >
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="coverLetter" disabled={isPending}><FileText className="mr-2 h-4 w-4 shrink-0" />Letter</TabsTrigger>
                            <TabsTrigger value="cv" disabled={isPending}><Briefcase className="mr-2 h-4 w-4 shrink-0" />CV</TabsTrigger>
                            <TabsTrigger value="qAndA" disabled={isPending}><MessageSquareMore className="mr-2 h-4 w-4 shrink-0" />Q&A</TabsTrigger>
                            <TabsTrigger value="deepAnalysis" disabled={isPending}><Lightbulb className="mr-2 h-4 w-4 shrink-0" />Analysis</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                      <FormLabel>Your Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide your detailed bio. The more details, the better the result!"
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
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear} className="w-full sm:w-auto">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>

      {/* Output Column */}
      <div className="flex flex-col gap-8">
        {isGenerating && !allResults && <OutputSkeletons />}
        {error && !isPending && !allResults &&(
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="prose-sm">{error}</AlertDescription>
          </Alert>
        )}
        {allResults && (
          <div className="space-y-4">
             <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="coverLetter" disabled={isPending}><FileText className="mr-2 h-4 w-4 shrink-0" />Letter</TabsTrigger>
                <TabsTrigger value="cv" disabled={isPending}><Briefcase className="mr-2 h-4 w-4 shrink-0" />CV</TabsTrigger>
                <TabsTrigger value="qAndA" disabled={isPending}><MessageSquareMore className="mr-2 h-4 w-4 shrink-0" />Q&A</TabsTrigger>
                <TabsTrigger value="deepAnalysis" disabled={isPending}><Lightbulb className="mr-2 h-4 w-4 shrink-0" />Analysis</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-8">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
