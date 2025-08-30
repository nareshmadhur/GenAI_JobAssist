
'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
  } from '@/components/ui/card';

interface ErrorDisplayProps {
  errorMessage: string;
  onRetry: () => void;
}

/**
 * A component to display an error message with a retry button.
 *
 * @param {ErrorDisplayProps} props - The component props.
 * @returns {JSX.Element} The rendered error display component.
 */
export function ErrorDisplay({
  errorMessage,
  onRetry,
}: ErrorDisplayProps): JSX.Element {
  return (
    <Card>
        <CardContent className="p-4">
            <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription className="prose-sm dark:prose-invert">
                <p>An error occurred while trying to generate the content. This can sometimes happen if the AI service is overloaded. Please try again.</p>
                <p className='text-xs italic mt-2'>Error: {errorMessage}</p>
            </AlertDescription>
            <Button onClick={onRetry} variant="destructive" className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
            </Button>
            </Alert>
        </CardContent>
    </Card>
  );
}
