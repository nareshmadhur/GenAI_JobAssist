'use client';

import {
  Briefcase,
  FileText,
  KeyRound,
  Lightbulb,
  Loader2,
  MessageSquareMore,
  Trash2,
} from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import type { JobApplicationData } from '@/lib/schemas';
import type { ActiveView, GenerationType } from './job-spark-app';
import { FeedbackDialog } from './feedback-dialog';

interface InputFormProps {
  isGenerating: boolean;
  activeView: ActiveView;
  onGeneration: (generationType: GenerationType) => void;
  onClear: () => void;
  jobDescription: string;
  bio: string;
  lastGeneratedOutput: string;
}

/**
 * A component that renders the main input form for the application, including
 * text areas for job description and bio, and buttons to trigger content generation.
 *
 * @param {InputFormProps} props - The component props.
 * @returns {JSX.Element} The rendered input form.
 */
export function InputForm({
  isGenerating,
  activeView,
  onGeneration,
  onClear,
  jobDescription,
  bio,
  lastGeneratedOutput,
}: InputFormProps): JSX.Element {
  // We get the form context from the parent provider.
  const formMethods = useFormContext<Omit<JobApplicationData, 'generationType'>>();

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Your Information</CardTitle>
        <CardDescription className="prose-sm">
          Provide your info, then choose what to generate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...formMethods}>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="space-y-6"
          >
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
                    This will be compared against the job description to find
                    matches and gaps.
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
                    Use this to answer questions like "Why are you interested in
                    this role?". If left blank, the AI will try to find
                    questions in the job description.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Application Materials */}
          <div className="space-y-2">
            <h3 className="text-center text-sm font-semibold text-muted-foreground">
              Application Materials
            </h3>
            <Button
              onClick={() => onGeneration('coverLetter')}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating && activeView === 'coverLetter' ? (
                <Loader2 className="animate-spin" />
              ) : (
                <FileText />
              )}
              Generate Cover Letter
            </Button>
            <Button
              onClick={() => onGeneration('cv')}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating && activeView === 'cv' ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Briefcase />
              )}
              Generate CV Advice
            </Button>
          </div>
          {/* Job Insights */}
          <div className="space-y-2">
            <h3 className="text-center text-sm font-semibold text-muted-foreground">
              Job Insights
            </h3>
            <Button
              onClick={() => onGeneration('deepAnalysis')}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating && activeView === 'deepAnalysis' ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Lightbulb />
              )}
              Generate Analysis
            </Button>
            <Button
              onClick={() => onGeneration('qAndA')}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating && activeView === 'qAndA' ? (
                <Loader2 className="animate-spin" />
              ) : (
                <MessageSquareMore />
              )}
              Answer Questions
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex w-full items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onClear}
            aria-label="Clear All"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <FeedbackDialog
            jobDescription={jobDescription}
            bio={bio}
            lastGeneratedOutput={lastGeneratedOutput}
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
                  <h4 className="font-medium leading-none">Custom API Key</h4>
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
      </CardFooter>
    </Card>
  );
}
