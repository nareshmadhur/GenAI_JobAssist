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
 * downloading a text-based PDF from CV data. This is used inside the
 * warning dialog for incomplete CVs.
 *
 * @param {{ cvData: CvOutput }} props - The component props.
 * @returns {JSX.Element | null} The rendered download link or status indicator.
 */
export function PdfDownloadClient({ cvData, className }: { cvData: CvOutput, className?: string }): JSX.Element | null {
  // This renders as the "Continue Anyway" button in the dialog.
  return (
    <PDFDownloadLink
      document={<CvPdfDocument cvData={cvData} />}
      fileName="cv.pdf"
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

/**
 * A client-only component that renders a direct PDF download button.
 * This is used when the CV has no missing information.
 *
 * @param {{ cvData: CvOutput, className?: string }} props - The component props.
 * @returns {JSX.Element | null} The rendered download link or status indicator.
 */
export function DirectPdfDownloadButton({ cvData, className }: { cvData: CvOutput, className?: string }) {
  return (
     <PDFDownloadLink
      document={<CvPdfDocument cvData={cvData} />}
      fileName="cv.pdf"
    >
      {({ loading, error }) => {
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
