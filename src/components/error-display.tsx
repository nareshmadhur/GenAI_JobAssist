import { AlertTriangle, Copy, Check } from 'lucide-react';
import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * A component to display an error message with a copy-to-clipboard button for the details.
 *
 * @param {object} props - The component props.
 * @param {string} props.error - The error message to display.
 * @returns {JSX.Element} The rendered error display component.
 */
export function ErrorDisplay({ error }: { error: string }): JSX.Element {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(error).then(
      () => {
        setIsCopied(true);
        toast({ title: 'Error details copied to clipboard!' });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        console.error('Failed to copy error details:', err);
        toast({
          variant: 'destructive',
          title: 'Copy Failed',
          description: 'Could not write to clipboard.',
        });
      }
    );
  };

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Generation Failed</AlertTitle>
      <AlertDescription>
        <p>
          An error occurred while generating the content. Please try again or adjust
          your input.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCopy}
          className="mt-4"
        >
          {isCopied ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Error Details
        </Button>
      </AlertDescription>
    </Alert>
  );
}
