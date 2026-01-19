
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { JobApplicationData } from '@/lib/schemas';
import { ExpandableTextarea } from '@/components/expandable-textarea';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Wand2, Sparkles } from 'lucide-react';
import { BioCreatorModal } from './bio-creator-modal';
import { exampleJobDescription, exampleBio } from '@/lib/example-data';

/**
 * A component that renders the main input form for the application, including
 * text areas for job description and bio.
 *
 * @returns {JSX.Element} The rendered input form.
 */
export function InputForm(): JSX.Element {
  const formMethods = useFormContext<Omit<JobApplicationData, 'generationType'>>();
  const { watch } = formMethods;
  const [isBioCreatorOpen, setIsBioCreatorOpen] = useState(false);
  
  const jobDescription = watch('jobDescription');
  const bio = watch('bio');
  const showExampleLoader = !jobDescription && !bio;

  const handleLoadExample = () => {
    formMethods.setValue('jobDescription', exampleJobDescription);
    formMethods.setValue('bio', exampleBio);
    formMethods.setValue('questions', '');
  };

  const handleBioUpdate = (newBio: string) => {
    formMethods.setValue('bio', newBio);
  };

  const bioCreatorTrigger = (
    <div className='flex justify-end'>
        <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={() => setIsBioCreatorOpen(true)}
            className="-mt-2"
        >
            <Wand2 className="mr-2 h-4 w-4" />
            Launch AI Bio Assistant
        </Button>
    </div>
  );

  return (
    <>
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Your Information</CardTitle>
              <CardDescription className="prose-sm mt-1.5">
                Provide your info, then choose what to generate from the actions below.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showExampleLoader && (
            <div className="mb-8 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-6 text-center">
                <div className="flex justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Sparkles className="h-6 w-6" />
                    </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                    See the Magic Instantly
                </h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                    New here? Load a pre-filled example to see what AI Job Assist can do for you.
                </p>
                <Button 
                    variant="default"
                    size="sm" 
                    onClick={handleLoadExample} 
                    className="mt-4 animate-ring-pulse"
                >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Load Example & Get Started
                </Button>
            </div>
          )}
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
                    footer={bioCreatorTrigger}
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
      <BioCreatorModal
        isOpen={isBioCreatorOpen}
        onOpenChange={setIsBioCreatorOpen}
        initialBio={formMethods.getValues('bio')}
        onBioUpdate={handleBioUpdate}
      />
    </>
  );
}
