
'use client';

import { Wand2, Loader2 } from 'lucide-react';
import React, { useTransition, useEffect } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { ReviseResponseSchema, type ReviseResponseData, JobApplicationData } from '@/lib/schemas';

interface RevisionFormProps {
  currentResponse: string;
  generationType: 'coverLetter' | 'qAndA';
  onRevision: (data: ReviseResponseData) => Promise<void>;
}

/**
 * A form component for submitting revision requests for AI-generated content.
 *
 * @param {RevisionFormProps} props - The component props.
 * @returns {JSX.Element} The rendered revision form.
 */
export function RevisionForm({
  currentResponse,
  generationType,
  onRevision,
}: RevisionFormProps): JSX.Element {
  const [isRevising, startRevising] = useTransition();
  // Get the main form's context to access bio and job description
  const mainForm = useFormContext<Omit<JobApplicationData, 'generationType'>>();

  const revisionForm = useForm<Omit<ReviseResponseData, 'jobDescription' | 'bio'>>({
    resolver: zodResolver(ReviseResponseSchema.omit({ jobDescription: true, bio: true })),
    defaultValues: {
      revisionComments: '',
      originalResponse: currentResponse,
      generationType: generationType,
    },
  });

  useEffect(() => {
    revisionForm.setValue('originalResponse', currentResponse);
    revisionForm.setValue('generationType', generationType);
  }, [currentResponse, generationType, revisionForm]);

  /**
   * Handles the submission of the revision form.
   * @param {Omit<ReviseResponseData, 'jobDescription' | 'bio'>} data - The form data.
   */
  async function onRevise(data: Omit<ReviseResponseData, 'jobDescription' | 'bio'>) {
    const { jobDescription, bio } = mainForm.getValues();
    const fullData: ReviseResponseData = {
      ...data,
      jobDescription,
      bio,
    };

    startRevising(async () => {
      await onRevision(fullData);
      revisionForm.reset({
        ...revisionForm.getValues(),
        revisionComments: '',
      });
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
        <CardDescription className="prose-sm dark:prose-invert">
          Not quite right? Tell the AI how to improve the response.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...revisionForm}>
          <Form {...revisionForm}>
            <form
              onSubmit={revisionForm.handleSubmit(onRevise)}
              className="space-y-4"
            >
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
              <Button
                type="submit"
                variant="outline"
                disabled={
                  isRevising ||
                  !revisionForm.formState.isDirty ||
                  !revisionForm.formState.isValid
                }
                className="w-full sm:w-auto"
              >
                {isRevising ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Revise
              </Button>
            </form>
          </Form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
