
"use client";

import React, { useState, useTransition, useEffect, useCallback, Fragment } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, CheckCircle2, XCircle, Wand2, Edit, Save, Trash2, FileText, Briefcase, Lightbulb, MessageSquareMore, AlertTriangle, KeyRound, MessageSquareHeart } from "lucide-react";
import Markdown from 'react-markdown';
import { compiler } from 'markdown-to-jsx';
import ReactDOMServer from 'react-dom/server';


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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  JobApplicationSchema, 
  ReviseResponseSchema,
  type JobApplicationData, 
  type ReviseResponseData,
  type QAndAOutput
} from "@/lib/schemas";
import { generateAction, reviseAction, AllGenerationResults } from "@/app/actions";
import { DeepAnalysisOutput, CvOutput } from "@/ai/flows";
import { CvView } from './cv-view';
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

type GenerationType = 'coverLetter' | 'cv' | 'deepAnalysis' | 'qAndA';
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
    const plainText = textToCopy.replace(/[\*\-_#]/g, ''); 

    try {
        const reactElement = compiler(textToCopy, { forceBlock: true });
        const html = ReactDOMServer.renderToString(reactElement);
        
        const blobHtml = new Blob([html], { type: 'text/html' });
        const blobText = new Blob([plainText], { type: 'text/plain' });
        
        await navigator.clipboard.write([
            new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText,
            })
        ]);
        
        setIsCopied(true);
        toast({ title: "Copied to clipboard!" });
        setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
        console.error("Failed to copy rich text, falling back to plain text:", err);
        navigator.clipboard.writeText(plainText).then(() => {
            setIsCopied(true);
            toast({ title: "Copied as plain text!" });
            setTimeout(() => setIsCopied(false), 2000);
        }, () => {
            toast({ variant: "destructive", title: "Copy failed", description: "Could not write to clipboard." });
        });
    }
  };


  return (
    <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy text" className={className}>
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function GeneratedResponse({ 
  initialValue, 
  onValueChange, 
  generationType, 
  onRevision, 
  jobDescription,
  bio
}: { 
  initialValue: string;
  onValueChange: (value: string) => void;
  generationType: 'coverLetter';
  onRevision: (data: ReviseResponseData) => Promise<void>;
  jobDescription: string;
  bio: string;
}) {
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
        <div className="prose max-w-none p-4 min-h-[150px] rounded-md border bg-background relative">
          <Markdown>{localValue}</Markdown>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="absolute top-0 right-0">
              <Edit className="h-4 w-4" />
          </Button>
        </div>
      )}
      <RevisionForm
        currentResponse={debouncedValue}
        generationType={generationType}
        onRevision={onRevision}
        jobDescription={jobDescription}
        bio={bio}
      />
    </div>
  );
}


function DeepAnalysisView({ deepAnalysis }: { deepAnalysis: DeepAnalysisOutput }) {
  const renderRequirements = (items: typeof deepAnalysis.mustHaves) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">No specific requirements were identified in this category.</p>
      );
    }
    return (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
                {item.isMet 
                  ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" /> 
                  : <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                }
                <span className="text-sm">{item.requirement}</span>
            </li>
          ))}
        </ul>
    );
  };
  
  const renderImprovementAreas = (details?: string[]) => {
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
          <div className="prose max-w-none">
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
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <span>Must-Have Requirements</span>
          </CardTitle>
          <CardDescription className="prose-sm">Essential criteria for the role and your alignment.</CardDescription>
        </CardHeader>
        <CardContent>
            {renderRequirements(deepAnalysis.mustHaves)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <span>Preferred Qualifications</span>
          </CardTitle>
          <CardDescription className="prose-sm">"Nice-to-have" skills and your alignment.</CardDescription>
        </CardHeader>
        <CardContent>
          {renderRequirements(deepAnalysis.preferred)}
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
          {renderImprovementAreas(deepAnalysis.improvementAreas)}
        </CardContent>
      </Card>
    </div>
  );
}

function QAndAView({ qAndA }: { qAndA: QAndAOutput }) {
  if (!qAndA.questionsFound) {
    return (
        <Card>
            <CardContent className="p-4 text-center text-muted-foreground">
                <p>No questions were found in the job description, and none were provided by you.</p>
            </CardContent>
        </Card>
    );
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
                <div className="prose prose-sm max-w-none">
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


function FeedbackForm({ jobDescription, bio, lastGeneratedOutput, closeDialog }: { jobDescription: string; bio: string; lastGeneratedOutput: string, closeDialog: () => void; }) {
    const [name, setName] = useState('');
    const [feedback, setFeedback] = useState('');
    const [includeJD, setIncludeJD] = useState(true);
    const [includeBio, setIncludeBio] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLSevlFVGQ1i4EBKiZLquITCGtCxFtetWpumNxKFLN9vGzd7aTw/viewform?usp=pp_url";
        const entry_JD = "entry.685011891";
        const entry_BIO = "entry.1458936165";
        const entry_QNA = "entry.292295861";
        const entry_COMMENT = "entry.1898597184";
        const entry_NAME = "entry.145348937";

        const params = new URLSearchParams();
        if (includeJD && jobDescription) params.append(entry_JD, jobDescription);
        if (includeBio && bio) params.append(entry_BIO, bio);
        if (lastGeneratedOutput) params.append(entry_QNA, lastGeneratedOutput);
        if (feedback) params.append(entry_COMMENT, feedback);
        if (name) params.append(entry_NAME, name);
        
        const url = `${baseUrl}&${params.toString()}`;
        window.open(url, '_blank');
        closeDialog();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="includeJD" checked={includeJD} onCheckedChange={(checked) => setIncludeJD(Boolean(checked))} />
                    <Label htmlFor="includeJD" className="text-sm font-normal">Include Job Description</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="includeBio" checked={includeBio} onCheckedChange={(checked) => setIncludeBio(Boolean(checked))} />
                    <Label htmlFor="includeBio" className="text-sm font-normal">Include Bio/Resume</Label>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="feedbackName">Name (Optional)</Label>
                <Input id="feedbackName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="feedbackText">Feedback</Label>
                <Textarea id="feedbackText" value={feedback} onChange={(e) => setFeedback(e.target.value)} required placeholder="Your feedback is valuable!" />
            </div>
            <Button type="submit" disabled={!feedback}>Submit Feedback</Button>
        </form>
    );
}


export function JobSparkApp() {
  const [isGenerating, startGenerating] = useTransition();
  const [activeView, setActiveView] = useState<ActiveView>('none');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const { toast } = useToast();
  
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
  

  const handleGeneration = (generationType: GenerationType) => {
    formMethods.trigger(['jobDescription', 'bio']).then(isValid => {
        if (!isValid) {
            toast({ variant: "destructive", title: "Please fill out both Job Description and Bio fields."});
            return;
        }
        
        const data = { ...formMethods.getValues(), generationType };

        setActiveView(generationType);
        setGenerationError(null);

        // Clear previous results for this type to force re-generation
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
                toast({ variant: "destructive", title: "Generation Failed", description: response.error });
            }
        });
    });
  }
  
  const handleManualEdit = (newValue: string, generationType: 'coverLetter') => {
      setAllResults(prev => {
        if (!prev[generationType]) return prev;
        const newResult = { ...prev[generationType]!, responses: newValue };
        return { ...prev, [generationType]: newResult };
      });
  };

  const handleRevision = async (data: ReviseResponseData) => {
    const result = await reviseAction(data);
    if (result.success) {
      const { generationType } = data;
      if (generationType === 'cv' || generationType === 'qAndA') {
        return;
      }
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
  const coverLetterResponse = allResults.coverLetter?.responses ?? "";

  const getLastGeneratedOutput = () => {
      if (activeView === 'none' || !allResults[activeView]) return "";
      
      const activeResult = allResults[activeView];
      if (!activeResult) return "";
      
      if ('responses' in activeResult) { // CoverLetter
          return activeResult.responses;
      }
      if ('sections' in activeResult) { // CV
          return JSON.stringify(activeResult, null, 2);
      }
      if ('jobSummary' in activeResult) { // Deep Analysis
          return JSON.stringify(activeResult, null, 2);
      }
      if ('qaPairs' in activeResult) { // Q&A
          return JSON.stringify(activeResult, null, 2);
      }
      return "";
  };


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
                    jobDescription={jobDescription}
                    bio={bio}
                />
            );
          case 'cv':
             if (!allResults.cv) return null;
             return <CvView cvData={allResults.cv as CvOutput} />;
          case 'deepAnalysis':
            if (!allResults.deepAnalysis) return null;
            return <DeepAnalysisView deepAnalysis={allResults.deepAnalysis} />;
          case 'qAndA':
            if (!allResults.qAndA) return null;
            return <QAndAView qAndA={allResults.qAndA as QAndAOutput} />;
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
      qAndA: { title: "Q & A", icon: <MessageSquareMore className="h-5 w-5" /> },
  };

  return (
    <FormProvider {...formMethods}>
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
                <Form {...formMethods}>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                    <FormField
                        control={formMethods.control}
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
                        control={formMethods.control}
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
                    <FormField
                        control={formMethods.control}
                        name="questions"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Specific Questions (Optional)</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Have specific questions? Enter them here, one per line. The AI will answer them using your bio and the job description."
                                className="min-h-[100px]"
                                {...field}
                            />
                            </FormControl>
                             <FormDescription className="prose-sm">
                                Use this to answer questions like "Why are you interested in this role?". If left blank, the AI will try to find questions in the job description.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {/* Application Materials */}
                  <div className="space-y-2">
                      <h3 className="font-semibold text-center text-sm text-muted-foreground">Application Materials</h3>
                      <Button onClick={() => handleGeneration('coverLetter')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'coverLetter' ? <Loader2 className="animate-spin" /> : <FileText />}
                          Generate Cover Letter
                      </Button>
                      <Button onClick={() => handleGeneration('cv')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'cv' ? <Loader2 className="animate-spin" /> : <Briefcase />}
                          Generate CV Advice
                      </Button>
                  </div>
                  {/* Job Insights */}
                  <div className="space-y-2">
                      <h3 className="font-semibold text-center text-sm text-muted-foreground">Job Insights</h3>
                      <Button onClick={() => handleGeneration('deepAnalysis')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'deepAnalysis' ? <Loader2 className="animate-spin" /> : <Lightbulb />}
                          Generate Analysis
                      </Button>
                       <Button onClick={() => handleGeneration('qAndA')} disabled={isGenerating} className="w-full">
                          {isGenerating && activeView === 'qAndA' ? <Loader2 className="animate-spin" /> : <MessageSquareMore />}
                          Answer Questions
                      </Button>
                  </div>
              </div>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 w-full">
                <Button type="button" variant="outline" onClick={handleClear} className="flex-grow">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                </Button>
                
                <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                        <MessageSquareHeart className="mr-2 h-4 w-4" />
                        Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Provide Feedback</DialogTitle>
                      <DialogDescription>
                        Your feedback helps us improve the AI. Tell us what you think!
                      </DialogDescription>
                    </DialogHeader>
                    <FeedbackForm
                      jobDescription={formMethods.getValues('jobDescription')}
                      bio={formMethods.getValues('bio')}
                      lastGeneratedOutput={getLastGeneratedOutput()}
                      closeDialog={() => setIsFeedbackDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <KeyRound className="mr-2 h-4 w-4" />
                            API Key
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                         <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Custom API Key</h4>
                                <p className="text-sm text-muted-foreground">
                                    Use your own Gemini API key for requests.
                                </p>
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="apiKey">Gemini API Key</Label>
                                <Input id="apiKey" type="password" placeholder="Enter your Gemini API key" />
                             </div>
                         </div>
                    </PopoverContent>
                </Popover>
              </div>

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
                            allResults[key] && (
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
                            )
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

function RevisionForm({ 
    currentResponse, 
    generationType, 
    onRevision,
    jobDescription,
    bio
}: { 
    currentResponse: string; 
    generationType: 'coverLetter';
    onRevision: (data: ReviseResponseData) => Promise<void>;
    jobDescription: string;
    bio: string;
}) {
  const [isRevising, startRevising] = useTransition();

  const revisionForm = useForm<ReviseResponseData>({
    resolver: zodResolver(ReviseResponseSchema),
    defaultValues: {
      revisionComments: "",
      jobDescription: jobDescription,
      bio: bio,
      originalResponse: currentResponse,
      generationType: generationType,
    },
  });
  
  useEffect(() => {
      revisionForm.setValue('jobDescription', jobDescription);
      revisionForm.setValue('bio', bio);
      revisionForm.setValue('originalResponse', currentResponse);
  }, [currentResponse, jobDescription, bio, revisionForm]);

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
          <Form {...revisionForm}>
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
          </Form>
      </CardContent>
    </Card>
  )
}
