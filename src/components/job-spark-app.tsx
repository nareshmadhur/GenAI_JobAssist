"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useForm, useFormContext, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, Info, CheckCircle2, XCircle, Wand2 } from "lucide-react";
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
  type GenerationResult 
} from "@/lib/schemas";
import { generateAction, reviseAction } from "@/app/actions";
import { Skeleton } from "./ui/skeleton";

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

function RevisionForm({ originalData, currentResponse, onRevisionComplete }: { originalData: JobApplicationData, currentResponse: string, onRevisionComplete: (newResponse: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const revisionForm = useForm<ReviseResponseData>({
    resolver: zodResolver(ReviseResponseSchema),
    defaultValues: {
      ...originalData,
      originalResponse: currentResponse,
      revisionComments: "",
    },
  });

  useEffect(() => {
    revisionForm.reset({
      ...originalData,
      originalResponse: currentResponse,
      revisionComments: "",
    })
  }, [currentResponse, originalData, revisionForm])


  async function onRevise(data: ReviseResponseData) {
    startTransition(async () => {
      const result = await reviseAction(data);
      if (result.success) {
        onRevisionComplete(result.data.responses);
        revisionForm.reset({ ...data, originalResponse: result.data.responses, revisionComments: '' });
      } else {
         toast({
          variant: "destructive",
          title: "Revision Failed",
          description: result.error,
        });
      }
    });
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
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? (
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

function GeneratedResponse({ initialValue, onValueChange }: { initialValue: string, onValueChange: (value: string) => void }) {
  useEffect(() => {
    onValueChange(initialValue);
  }, [initialValue, onValueChange]);

  return (
     <Textarea
        value={initialValue}
        onChange={(e) => onValueChange(e.target.value)}
        className="min-h-[250px] font-code bg-background"
        aria-label="Generated Response"
      />
  );
}

export function JobSparkApp() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedData, setLastSubmittedData] = useState<JobApplicationData | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>("");

  const { toast } = useToast();

  const form = useForm<JobApplicationData>({
    resolver: zodResolver(JobApplicationSchema),
    defaultValues: {
      jobDescription: "",
      bio: "",
    },
  });

  function onSubmit(data: JobApplicationData) {
    setError(null);
    setResult(null);
    setCurrentResponse("");
    setLastSubmittedData(data);
    startTransition(async () => {
      const response = await generateAction(data);
      if (response.success) {
        setResult(response.data);
        setCurrentResponse(response.data.response.responses);
      } else {
        setError(response.error);
        toast({
          variant: "destructive",
          title: "Generation Failed",
          description: response.error,
        });
      }
    });
  }

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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90">
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Responses
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>

      {/* Output Column */}
      <div className="flex flex-col gap-8">
        {isPending && !result && <OutputSkeletons />}
        {error && !result &&(
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <div className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Your Tailored Response</CardTitle>
                <CopyButton textToCopy={currentResponse} />
              </CardHeader>
              <CardContent>
                <GeneratedResponse initialValue={currentResponse} onValueChange={setCurrentResponse} />
              </CardContent>
            </Card>

            {lastSubmittedData && (
              <RevisionForm 
                originalData={lastSubmittedData} 
                currentResponse={currentResponse} 
                onRevisionComplete={setCurrentResponse}
              />
            )}

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
                  <div className="prose prose-sm text-muted-foreground max-w-none">
                    {result.analysis.matches.map((item, index) => <Markdown key={`match-${index}`} components={{p: ({children}) => <p className="list-item ml-5">{children}</p>}}>{item}</Markdown>)}
                  </div>
                </div>
                 <div className="space-y-4">
                  <h3 className="flex items-center font-semibold text-lg">
                    <XCircle className="h-5 w-5 mr-2 text-red-500" />
                    Potential Gaps
                  </h3>
                   <div className="prose prose-sm text-muted-foreground max-w-none">
                    {result.analysis.gaps.map((item, index) => <Markdown key={`gap-${index}`} components={{p: ({children}) => <p className="list-item ml-5">{children}</p>}}>{item}</Markdown>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
