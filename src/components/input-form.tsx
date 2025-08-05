
'use client';

import { useFormContext } from 'react-hook-form';

import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from '@/components/ui/textarea';
import type { JobApplicationData } from '@/lib/schemas';
import { ExpandableTextarea } from './expandable-textarea';

/**
 * A component that renders the main input form for the application, including
 * text areas for job description and bio.
 *
 * @returns {JSX.Element} The rendered input form.
 */
export function InputForm(): JSX.Element {
  const formMethods = useFormContext<Omit<JobApplicationData, 'generationType'>>();

  return (
    <Card className="bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Your Information</CardTitle>
        <CardDescription className="prose-sm">
          Provide your info, then choose what to generate from the actions below.
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
                <ExpandableTextarea
                  field={field}
                  label="Job Description"
                  placeholder="Paste the full job description here. The AI will analyze it to find the key requirements."
                  description="The AI will analyze this to find key requirements."
                />
              )}
            />
            <FormField
              control={formMethods.control}
              name="bio"
              render={({ field }) => (
                <ExpandableTextarea
                  field={field}
                  label="Your Bio / Resume"
                  placeholder="Provide your detailed bio or paste your resume. The more details, the better the result!"
                  description="This will be compared against the job description to find matches and gaps."
                />
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
    </Card>
  );
}
