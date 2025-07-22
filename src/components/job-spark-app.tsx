
"use client";

import React, { useState, useTransition, useEffect, useCallback, Fragment } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, CheckCircle2, XCircle, Wand2, Edit, Save, Trash2, FileText, Briefcase, Lightbulb, MessageSquareMore, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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
import { generateAction, AllGenerationResults } from "@/app/actions";
import { DeepAnalysisOutput, QAndAOutput } from "@/ai/flows";
import { Skeleton } from "./ui/skeleton";
import { Separator } from "./ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "@/lib/utils";

const LOCAL_STORAGE_KEY = 'jobspark_form_data';

type GenerationType = 'coverLetter' | 'cv' | 'deepAnalysis' | 'qAndA';
type GeneratingState = { [key in GenerationType]?: boolean };
type ErrorState = { [key in GenerationType]?: string | null };

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
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
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

function GeneratedResponse({ initialValue, onValueChange }: { initialValue: string, onValueChange: (value: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);

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
    </div>
  );
}

function CollapsibleSection({ 
    title, 
    description, 
    icon, 
    children, 
    generationType, 
    isGenerating,
    error,
    resultExists 
} : { 
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    children: React.ReactNode, 
    generationType: GenerationType,
    isGenerating: boolean,
    error: string | null | undefined,
    resultExists: boolean
}) {
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
      // Auto-open the section when results come in
      if(resultExists && !isGenerating && !error) {
        setIsOpen(true);
      }
    }, [resultExists, isGenerating, error]);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} asChild>
          <Card>
            <CardHeader className="p-4">
                <CollapsibleTrigger asChild>
                    <div className="flex justify-between items-center cursor-pointer">
                        <div className="flex items-center gap-3">
                            {icon}
                            <div className="flex flex-col">
                                <CardTitle className="text-xl">{title}</CardTitle>
                                <CardDescription className="prose-sm">{description}</CardDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon">
                            {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </Button>
                    </div>
                </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4 pt-0">
                  {isGenerating ? (
                      <SectionSkeleton />
                  ) : error ? (
                      <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Generation Failed</AlertTitle>
                          <AlertDescription>{error}</AlertDescription>
                      </Alert>
                  ) : (
                      resultExists ? children : null
                  )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
    )
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

function QAndAView({ qAndA }: { qAndA: QAndAOutput }) {
  if (!qAndA.questionsFound) {
    return (
        <CardContent>
          <p className="prose-sm">No explicit questions were found in the job description.</p>
        </CardContent>
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
                {missingAnswersCount} question{missingAnswersCount > 1 ? 's' : ''} could not be answered based on your bio. These are highlighted below.
            </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="prose-sm">Generated Answers</CardTitle>
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
  const [generating, setGenerating] = useState<GeneratingState>({});
  const [errors, setErrors] = useState<ErrorState>({});
  const [allResults, setAllResults] = useState<AllGenerationResults>({});
  
  const [isRevising, startRevising] = useTransition();

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

        setGenerating(prev => ({ ...prev, [generationType]: true }));
        setErrors(prev => ({ ...prev, [generationType]: null }));

        startRevising(async () => { // Using the same transition for all async actions
            const response = await generateAction(data);
            if (response.success) {
                setAllResults(prev => ({...prev, [generationType]: response.data}));
            } else {
                setErrors(prev => ({ ...prev, [generationType]: response.error }));
                toast({ variant: "destructive", title: "Generation Failed", description: response.error });
            }
            setGenerating(prev => ({ ...prev, [generationType]: false }));
        });
    });
  }
  
  const handleRevisionComplete = (result: any, generationType: GenerationType) => {
      startRevising(async () => {
        if (result.success) {
          const newResponseText = result.data.responses;
          setAllResults(prev => ({...prev!, [generationType]: { responses: newResponseText }}));
        } else {
           toast({
            variant: "destructive",
            title: "Revision Failed",
            description: result.error,
          });
        }
      });
  };
  
  const handleManualEdit = (newValue: string, generationType: GenerationType) => {
      setAllResults(prev => ({
          ...prev!, 
          [generationType]: { responses: newValue }
      }));
  };

  const handleClear = () => {
    form.reset({ jobDescription: "", bio: "" });
    setAllResults({});
    setGenerating({});
    setErrors({});
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear data from localStorage", e);
    }
  };
  
  const coverLetterResponse = allResults.coverLetter?.responses ?? "";
  const cvResponse = allResults.cv?.responses ?? "";
  
  // Use debounced values for the revision forms to prevent lag
  const debouncedCoverLetter = useDebounce(coverLetterResponse, 500);
  const debouncedCv = useDebounce(cvResponse, 500);
  
  const isGeneratingAny = Object.values(generating).some(Boolean);

  return (
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
            <FormProvider {...form}>
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
            </FormProvider>
          </CardContent>
          <CardFooter className="flex-col items-start gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Application Materials */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-center text-sm text-muted-foreground">Application Materials</h3>
                    <Button onClick={() => handleGeneration('coverLetter')} disabled={generating.coverLetter} className="w-full">
                        {generating.coverLetter ? <Loader2 className="animate-spin" /> : <FileText />}
                        Generate Letter
                    </Button>
                     <Button onClick={() => handleGeneration('cv')} disabled={generating.cv} className="w-full">
                        {generating.cv ? <Loader2 className="animate-spin" /> : <Briefcase />}
                        Generate CV
                    </Button>
                </div>
                {/* Job Insights */}
                <div className="space-y-2">
                     <h3 className="font-semibold text-center text-sm text-muted-foreground">Job Insights</h3>
                     <Button onClick={() => handleGeneration('qAndA')} disabled={generating.qAndA} className="w-full">
                        {generating.qAndA ? <Loader2 className="animate-spin" /> : <MessageSquareMore />}
                        Generate Q&A
                    </Button>
                     <Button onClick={() => handleGeneration('deepAnalysis')} disabled={generating.deepAnalysis} className="w-full">
                        {generating.deepAnalysis ? <Loader2 className="animate-spin" /> : <Lightbulb />}
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
        <CollapsibleSection
            title="Cover Letter"
            description="An AI-generated draft for your review."
            icon={<FileText className="h-6 w-6 text-primary" />}
            generationType="coverLetter"
            isGenerating={!!generating.coverLetter}
            error={errors.coverLetter}
            resultExists={!!allResults.coverLetter}
        >
             <div className="space-y-4">
                <div className="flex justify-end">
                    <CopyButton textToCopy={coverLetterResponse} />
                </div>
                <GeneratedResponse 
                    initialValue={coverLetterResponse} 
                    onValueChange={(val) => handleManualEdit(val, 'coverLetter')} 
                />
                <RevisionForm 
                    originalData={{...form.getValues(), generationType: 'coverLetter'}}
                    currentResponse={debouncedCoverLetter} 
                    onRevisionComplete={(res) => handleRevisionComplete(res, 'coverLetter')}
                    generationType="coverLetter"
                    isRevising={isRevising}
              />
            </div>
        </CollapsibleSection>

        <CollapsibleSection
            title="Curriculum Vitae (CV)"
            description="A professionally formatted CV tailored to the job."
            icon={<Briefcase className="h-6 w-6 text-primary" />}
            generationType="cv"
            isGenerating={!!generating.cv}
            error={errors.cv}
            resultExists={!!allResults.cv}
        >
            <div className="space-y-4">
                <div className="flex justify-end">
                    <CopyButton textToCopy={cvResponse} />
                </div>
                <GeneratedResponse 
                    initialValue={cvResponse}
                    onValueChange={(val) => handleManualEdit(val, 'cv')} 
                />
                <RevisionForm 
                    originalData={{...form.getValues(), generationType: 'cv'}}
                    currentResponse={debouncedCv} 
                    onRevisionComplete={(res) => handleRevisionComplete(res, 'cv')}
                    generationType="cv"
                    isRevising={isRevising}
                />
            </div>
        </CollapsibleSection>

        <CollapsibleSection
            title="Q&A"
            description="Answers to questions found in the job description."
            icon={<MessageSquareMore className="h-6 w-6 text-primary" />}
            generationType="qAndA"
            isGenerating={!!generating.qAndA}
            error={errors.qAndA}
            resultExists={!!allResults.qAndA}
        >
            {allResults.qAndA && <QAndAView qAndA={allResults.qAndA} />}
        </CollapsibleSection>

         <CollapsibleSection
            title="Deep Analysis"
            description="Strengths, gaps, and improvement areas."
            icon={<Lightbulb className="h-6 w-6 text-primary" />}
            generationType="deepAnalysis"
            isGenerating={!!generating.deepAnalysis}
            error={errors.deepAnalysis}
            resultExists={!!allResults.deepAnalysis}
        >
            {allResults.deepAnalysis && <DeepAnalysisView deepAnalysis={allResults.deepAnalysis} />}
        </CollapsibleSection>
      </div>
    </div>
  );
}


function RevisionForm({ originalData, currentResponse, onRevisionComplete, generationType, isRevising }: { originalData: JobApplicationData, currentResponse: string, onRevisionComplete: (newResponse: any, type: GenerationType) => void, generationType: 'cv' | 'coverLetter', isRevising: boolean }) {
  
  const revisionForm = useForm<ReviseResponseData>({
    resolver: zodResolver(ReviseResponseSchema),
    defaultValues: {
      jobDescription: originalData.jobDescription,
      bio: originalData.bio,
      originalResponse: currentResponse,
      revisionComments: "",
      generationType: generationType,
    },
  });
  
  // This effect synchronizes the props with the form state
  useEffect(() => {
      revisionForm.reset({
          jobDescription: originalData.jobDescription,
          bio: originalData.bio,
          originalResponse: currentResponse,
          revisionComments: revisionForm.getValues('revisionComments') || "", // keep existing comments
          generationType,
      });
  }, [currentResponse, originalData.jobDescription, originalData.bio, generationType, revisionForm]);


  async function onRevise(data: ReviseResponseData) {
    const { reviseAction } = await import('@/app/actions');
    onRevisionComplete(await reviseAction(data), generationType);
  }
  
  return (
    <Card className="mt-4 bg-muted/50">
      <CardHeader>
        <CardTitle className="text-xl">Revise Output</CardTitle>
        <CardDescription className="prose-sm">Not quite right? Tell the AI how to improve the response.</CardDescription>
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
                      placeholder="e.g., 'Make it more formal.' or 'Emphasize my experience with project management tools.'"
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
