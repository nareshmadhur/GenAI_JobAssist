
"use client";

import React, { useState, useTransition, useEffect, useCallback, Fragment } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, Info, CheckCircle2, XCircle, Wand2, Edit, Save, Trash2, FileText, FileJson, Briefcase, BotMessageSquare, Lightbulb, Target } from "lucide-react";
import Markdown from 'react-markdown';

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
import { DeepAnalysisOutput, GenerateCvOutput, GenerateCoverLetterOutput } from "@/ai/flows"; // Assuming barrel export
import { Skeleton } from "./ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

type GenerationType = 'coverLetter' | 'cv' | 'deepAnalysis';

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
          <Skeleton className="h-7 w-2/5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function CopyButton({ textToCopy }: { textToCopy: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy text">
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function RevisionForm({ originalData, currentResponse, onRevisionComplete, generationType, isRevising }: { originalData: JobApplicationData, currentResponse: string, onRevisionComplete: (newResponse: string) => void, generationType: GenerationType, isRevising: boolean }) {
  const { toast } = useToast();
  
  const revisionForm = useForm<ReviseResponseData>({
    resolver: zodResolver(ReviseResponseSchema),
    defaultValues: {
      jobDescription: originalData.jobDescription,
      bio: originalData.bio,
      originalResponse: currentResponse,
      revisionComments: "",
      generationType,
    },
  });
  
  useEffect(() => {
    revisionForm.reset({
      ...originalData,
      originalResponse: currentResponse,
      revisionComments: "",
      generationType,
    });
  }, [currentResponse, originalData.jobDescription, originalData.bio, generationType, revisionForm.reset]);


  async function onRevise(data: ReviseResponseData) {
    onRevisionComplete(await reviseAction(data));
  }
  
  return (
    <Card className="mt-4 bg-muted/50">
      <CardHeader>
        <CardTitle>Revise Output</CardTitle>
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
                      className="min-h-[100px] bg-background font-code"
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

function GeneratedResponse({ initialValue, onValueChange, isSaving }: { initialValue: string, onValueChange: (value: string) => void, isSaving: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    setLocalValue(initialValue);
    setIsEditing(false);
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
            className="min-h-[250px] font-code bg-background"
            aria-label="Generated Response"
          />
           <Button variant="ghost" size="icon" onClick={handleSave} className="absolute top-2 right-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
          </Button>
        </>
      ) : (
        <>
          <div className="prose prose-sm max-w-none p-4 min-h-[250px] rounded-md border bg-background font-code whitespace-pre-wrap">
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

function DeepAnalysisView({ analysis }: { analysis: DeepAnalysisOutput }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Overall Alignment: {analysis.overallAlignment.score}
          </CardTitle>
          <CardDescription>{analysis.overallAlignment.justification}</CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            Key Strengths
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysis.keyStrengths.map((item, index) => (
            <div key={index} className="p-3 rounded-md border bg-green-500/10">
              <p className="font-semibold text-green-800">Requirement:</p>
              <Markdown className="prose prose-sm max-w-none text-muted-foreground">{item.requirement}</Markdown>
              <p className="font-semibold mt-2 text-green-800">Evidence:</p>
              <Markdown className="prose prose-sm max-w-none text-muted-foreground">{item.evidence}</Markdown>
            </div>
          ))}
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            Improvement Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           {analysis.improvementAreas.map((item, index) => (
            <div key={index} className="p-3 rounded-md border bg-yellow-500/10">
              <p className="font-semibold text-yellow-800">Gap:</p>
              <Markdown className="prose prose-sm max-w-none text-muted-foreground">{item.requirement}</Markdown>
              <p className="font-semibold mt-2 text-yellow-800">Suggestion:</p>
              <Markdown className="prose prose-sm max-w-none text-muted-foreground">{item.suggestion}</Markdown>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotMessageSquare className="h-6 w-6 text-blue-500" />
            Language & Tone Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-semibold text-blue-800">Analysis:</p>
          <Markdown className="prose prose-sm max-w-none text-muted-foreground">{analysis.languageAndTone.analysis}</Markdown>
          <p className="font-semibold mt-2 text-blue-800">Suggestion:</p>
          <Markdown className="prose prose-sm max-w-none text-muted-foreground">{analysis.languageAndTone.suggestion}</Markdown>
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
  const [lastSubmittedData, setLastSubmittedData] = useState<Omit<JobApplicationData, 'generationType'> | null>(null);

  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [generationType, setGenerationType] = useState<GenerationType>('coverLetter');

  const debouncedEditableResponse = useDebounce(currentResponse, 500);

  const { toast } = useToast();
  
  const formSchema = JobApplicationSchema.pick({ jobDescription: true, bio: true });

  const form = useForm<Omit<JobApplicationData, 'generationType'>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
      bio: "",
    },
  });

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      }
    } catch (e) {
      console.error("Failed to load or parse data from localStorage", e);
    }
  }, [form.reset]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(value));
      } catch (e) {
        console.error("Failed to save data to localStorage", e);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const onSubmit = (data: Omit<JobApplicationData, 'generationType'>) => {
    setError(null);
    setAllResults(null);
    setCurrentResponse("");

    const fullData: JobApplicationData = { ...data, generationType: 'coverLetter' };
    setLastSubmittedData(data);
    setGenerationType('coverLetter');

    startInitialGeneration(async () => {
      const response = await generateInitialAction(fullData);
      if (response.success) {
        setAllResults(response.data);
        setCurrentResponse(response.data.coverLetter?.responses || "");
      } else {
        setError(response.error);
        toast({ variant: "destructive", title: "Generation Failed", description: response.error });
      }
    });
  }
  
  const onTabChange = (newTab: GenerationType) => {
    if (!lastSubmittedData || isSwitching || newTab === generationType) return;
    setGenerationType(newTab);
    
    const existingResult = allResults?.[newTab];
    if (existingResult && 'responses' in existingResult) {
       setCurrentResponse(existingResult.responses);
       return;
    }

    startSwitchingTab(async () => {
      const result = await generateSingleAction({ ...lastSubmittedData, generationType: newTab });
      if (result.success) {
        setAllResults(prev => ({ ...prev!, [newTab]: result.data }));
        if ('responses' in result.data) {
          setCurrentResponse(result.data.responses);
        }
      } else {
        toast({ variant: "destructive", title: "Failed to switch", description: result.error });
      }
    });
  }

  const handleRevisionComplete = (result: any) => {
      if (result.success) {
        const newResponseText = result.data.responses;
        setCurrentResponse(newResponseText);
        setAllResults(prev => ({...prev!, [generationType]: { responses: newResponseText }}));
      } else {
         toast({
          variant: "destructive",
          title: "Revision Failed",
          description: result.error,
        });
      }
  };

  const handleManualEdit = (newValue: string) => {
      setCurrentResponse(newValue);
      setAllResults(prev => ({...prev!, [generationType]: { responses: newValue }}));
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
    if ((event.altKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  }, [form, onSubmit]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const renderMarkdownList = (items: string[]) => {
    return items.map((item, index) => (
      <li key={index}>
        <Markdown components={{ p: Fragment }}>{item}</Markdown>
      </li>
    ));
  };
  
  const isPending = isGenerating || isSwitching;

  return (
    <div className="grid md:grid-cols-2 gap-8 w-full p-4 sm:p-6 md:p-8">
      {/* Input Column */}
      <div className="flex flex-col gap-8">
        <Card className="bg-card/80 backdrop-blur-sm sticky top-24">
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full job description here. The AI will analyze it to find the key requirements."
                          className="min-h-[150px] font-code"
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
                          className="min-h-[200px] font-code"
                          {...field}
                        />
                      </FormControl>
                       <FormDescription>
                        This will be compared against the job description to find matches and gaps.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={isGenerating} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
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
        {error && !allResults &&(
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {allResults && (
          <>
             <Tabs value={generationType} onValueChange={(v) => onTabChange(v as GenerationType)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coverLetter"><FileText className="mr-2 h-4 w-4" />Cover Letter</TabsTrigger>
                <TabsTrigger value="cv"><Briefcase className="mr-2 h-4 w-4" />CV</TabsTrigger>
                <TabsTrigger value="deepAnalysis"><FileJson className="mr-2 h-4 w-4" />Deep Analysis</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-8">
              {isSwitching ? <OutputSkeletons /> : (
                <>
                  {generationType === 'deepAnalysis' ? (
                     allResults.deepAnalysis ? <DeepAnalysisView analysis={allResults.deepAnalysis} /> : <p>No analysis generated.</p>
                  ) : (
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Your Tailored {generationType === 'cv' ? 'CV' : 'Cover Letter'}</CardTitle>
                        <CopyButton textToCopy={currentResponse} />
                      </CardHeader>
                      <CardContent>
                        <GeneratedResponse initialValue={currentResponse} onValueChange={handleManualEdit} isSaving={isRevising}/>
                      </CardContent>
                    </Card>
                  )}

                  {lastSubmittedData && generationType !== 'deepAnalysis' && (
                    <RevisionForm 
                      originalData={{...lastSubmittedData, generationType}}
                      currentResponse={debouncedEditableResponse} 
                      onRevisionComplete={(res) => startRevising(async () => handleRevisionComplete(res))}
                      generationType={generationType}
                      isRevising={isRevising}
                    />
                  )}
                  
                  {generationType !== 'deepAnalysis' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Analysis & Insights</CardTitle>
                      </CardHeader>
                      <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="flex items-center font-semibold text-lg">
                            <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                            Your Strengths
                          </h3>
                          <ul className="prose prose-sm text-muted-foreground max-w-none list-disc pl-5 space-y-2">
                            {renderMarkdownList(allResults.analysis.matches)}
                          </ul>
                        </div>
                         <div className="space-y-4">
                          <h3 className="flex items-center font-semibold text-lg">
                            <XCircle className="h-5 w-5 mr-2 text-red-500" />
                            Potential Gaps
                          </h3>
                           <ul className="prose prose-sm text-muted-foreground max-w-none list-disc pl-5 space-y-2">
                             {renderMarkdownList(allResults.analysis.gaps)}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
