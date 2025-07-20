"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles, Copy, Check, Info, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { JobApplicationSchema, type JobApplicationData, type GenerationResult } from "@/lib/schemas";
import { generateAction } from "@/app/actions";
import { Skeleton } from "./ui/skeleton";

function OutputSkeletons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-2/5" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
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

export function JobSparkApp() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<JobApplicationData>({
    resolver: zodResolver(JobApplicationSchema),
    defaultValues: {
      jobDescription: "",
      bio: "",
      comments: "",
    },
  });

  function onSubmit(data: JobApplicationData) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const response = await generateAction(data);
      if (response.success) {
        setResult(response.data);
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
    <div className="w-full">
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
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
                        className="min-h-[200px]"
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
              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other details to consider? e.g., 'Emphasize my passion for open-source contributions'."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
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
          </Form>
        </CardContent>
      </Card>
      
      <div className="mt-12">
        {isPending && <OutputSkeletons />}
        {error && (
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
                <CopyButton textToCopy={result.response.responses} />
              </CardHeader>
              <CardContent>
                <Textarea
                  defaultValue={result.response.responses}
                  className="min-h-[250px] font-code bg-background"
                  aria-label="Generated Response"
                />
              </CardContent>
            </Card>

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
                  <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                    {result.analysis.matches.map((item, index) => <li key={`match-${index}`}>{item}</li>)}
                  </ul>
                </div>
                 <div className="space-y-4">
                  <h3 className="flex items-center font-semibold text-lg">
                    <XCircle className="h-5 w-5 mr-2 text-red-500" />
                    Potential Gaps
                  </h3>
                  <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                    {result.analysis.gaps.map((item, index) => <li key={`gap-${index}`}>{item}</li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
