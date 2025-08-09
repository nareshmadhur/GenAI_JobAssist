
'use client';

import { CheckCircle2, Loader2, MessageSquareHeart } from 'lucide-react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface FeedbackDialogProps {
  jobDescription: string;
  bio: string;
  lastGeneratedOutput: string;
}

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSevlFVGQ1i4EBKiZLquITCGtCxFtetWpumNxKFLN9vGzd7aTw/formResponse';

/**
 * A dialog component for collecting user feedback. It uses a hidden iframe
 * to submit data to a Google Form without leaving the page.
 *
 * @param {FeedbackDialogProps} props - The component props.
 * @returns {JSX.Element} The rendered feedback dialog.
 */
export function FeedbackDialog({
  jobDescription,
  bio,
  lastGeneratedOutput,
}: FeedbackDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    // This event fires after the form is submitted and Google responds.
    if (isSubmitting) {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsDialogOpen(false);
        // Reset state for next time
        setTimeout(() => setIsSubmitted(false), 500);
      }, 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Don't prevent default, we want the native form submission to the iframe
    setIsSubmitting(true);
    // Add a timeout for cases where the iframe's load event might not fire (e.g., network issues)
    setTimeout(() => {
        if (isSubmitting) {
            setIsSubmitting(false);
            toast({
                variant: 'destructive',
                title: 'Submission Error',
                description: 'The feedback form timed out. Please try again.',
            });
        }
    }, 8000); // 8-second timeout
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <MessageSquareHeart className="h-4 w-4" />
            <span className="sr-only">Feedback</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve the AI. Tell us what you think!
            </DialogDescription>
          </DialogHeader>

          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
              <h3 className="text-xl font-semibold">Done!</h3>
              <p className="text-muted-foreground">
                Your feedback has been submitted.
              </p>
            </div>
          ) : (
            <form
              action={GOOGLE_FORM_URL}
              method="POST"
              target="feedback-iframe"
              onSubmit={handleSubmit}
              className="space-y-4 pt-4"
            >
              {/* Hidden fields to pass context */}
              {/* Job Description */}
              <input
                type="hidden"
                name="entry.685011891"
                value={jobDescription}
              />
              {/* Bio */}
              <input type="hidden" name="entry.1458936165" value={bio} />
              {/* Generated Output */}
              <input
                type="hidden"
                name="entry.667296479"
                value={lastGeneratedOutput}
              />

              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  name="entry.145348937"
                  placeholder="Your name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback">Feedback</Label>
                <Textarea
                  id="feedback"
                  name="entry.1898597184"
                  placeholder="Your feedback is valuable!"
                  required
                  disabled={isSubmitting}
                  className="bg-background"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="include-data" defaultChecked disabled={isSubmitting}/>
                <Label
                  htmlFor="include-data"
                  className="text-sm text-muted-foreground"
                >
                  Include job description & bio for better context.
                </Label>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <iframe
        ref={iframeRef}
        name="feedback-iframe"
        onLoad={handleIframeLoad}
        style={{ display: 'none' }}
        title="Feedback Submission Target"
      />
    </>
  );
}
