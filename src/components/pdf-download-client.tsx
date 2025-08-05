// This entire component is a client-side boundary.
'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { AlertTriangle, FileDown, Loader2 } from 'lucide-react';
import React from 'react';

import type { CvOutput } from '@/ai/flows/generate-cv';
import { Button } from '@/components/ui/button';
import { CvPdfDocument } from './cv-pdf-document';
import { cn } from '@/lib/utils';

/**
 * A client-only component that handles the logic for generating and
 * downloading a text-based PDF from CV data. It uses the `PDFDownloadLink`
 * component, which can only run in the browser.
 *
 * @param {{ cvData: CvOutput }} props - The component props.
 * @returns {JSX.Element | null} The rendered download link or status indicator.
 */
export function PdfDownloadClient({ cvData, className }: { cvData: CvOutput, className?: string }): JSX.Element | null {
  // The PDFDownloadLink component is a simpler and more direct way to handle downloads.
  return (
    <PDFDownloadLink
      document={<CvPdfDocument cvData={cvData} />}
      fileName="cv.pdf"
      // Pass the className to the underlying `a` tag for styling
      className={cn(
        // Default styling for the button, can be overridden
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
        // Specific variant styles
        'bg-primary text-primary-foreground hover:bg-primary/90',
        // Allow external class names to override
        className
      )}
    >
      {({ loading }) =>
        loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          'Continue Anyway'
        )
      }
    </PDFDownloadLink>
  );
}

// Special version for the direct download button when there's no missing info
export function DirectPdfDownloadButton({ cvData, className }: { cvData: CvOutput, className?: string }) {
  return (
     <PDFDownloadLink
      document={<CvPdfDocument cvData={cvData} />}
      fileName="cv.pdf"
    >
      {({ blob, url, loading, error }) => {
        const buttonContent = loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : error ? (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        ) : (
          <FileDown className="h-4 w-4" />
        );

        return (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Export CV as PDF"
            className={cn('text-slate-600 hover:text-slate-900', className)}
            disabled={loading}
          >
            {buttonContent}
          </Button>
        );
      }}
    </PDFDownloadLink>
  )
}
