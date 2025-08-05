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
export function PdfDownloadClient({ cvData }: { cvData: CvOutput }): JSX.Element | null {
  // The PDFDownloadLink component is a simpler and more direct way to handle downloads.
  return (
    <PDFDownloadLink
      document={<CvPdfDocument cvData={cvData} />}
      fileName="cv.pdf"
    >
      {({ blob, url, loading, error }) => {
        if (loading) {
          return (
            <Button variant="ghost" size="icon" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          );
        }

        if (error) {
          console.error('Error generating PDF:', error);
          return (
            <Button variant="ghost" size="icon" disabled>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </Button>
          );
        }

        return (
          // We render a standard button, but the parent `a` tag from PDFDownloadLink handles the click.
          <Button
            variant="ghost"
            size="icon"
            aria-label="Export CV as PDF"
            className="text-slate-600 hover:text-slate-900"
            asChild // Ensures the button doesn't have nested interactive elements
          >
            <div>
              <FileDown className="h-4 w-4" />
            </div>
          </Button>
        );
      }}
    </PDFDownloadLink>
  );
}
