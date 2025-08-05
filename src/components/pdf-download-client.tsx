// This entire component is a client-side boundary.
'use client';

import { usePDF } from '@react-pdf/renderer';
import { AlertTriangle, FileDown } from 'lucide-react';
import React, { useEffect } from 'react';

import type { CvOutput } from '@/ai/flows/generate-cv';
import { Button } from '@/components/ui/button';
import { CvPdfDocument } from './cv-pdf-document';

/**
 * A client-only component that handles the logic for generating and
 * downloading a text-based PDF from CV data. It uses the `usePDF`
 * hook, which can only run in the browser.
 *
 * @param {{ cvData: CvOutput }} props - The component props.
 * @returns {JSX.Element | null} The rendered download link or status indicator.
 */
export function PdfDownloadClient({ cvData }: { cvData: CvOutput }): JSX.Element | null {
  const [instance, updateInstance] = usePDF({
    document: <CvPdfDocument cvData={cvData} />,
  });

  // The PDF document needs to be re-rendered whenever the data changes.
  useEffect(() => {
    updateInstance();
  }, [cvData, updateInstance]);

  if (instance.loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <FileDown className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (instance.error) {
    console.error('Error generating PDF:', instance.error);
    return (
      <Button variant="ghost" size="icon" disabled>
        <AlertTriangle className="h-4 w-4 text-destructive" />
      </Button>
    );
  }

  // The `instance.url` will be a blob URL for the generated PDF.
  if (instance.url) {
    return (
      <a href={instance.url} download="cv.pdf">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Export CV as PDF"
          className="text-slate-600 hover:text-slate-900"
        >
          <FileDown className="h-4 w-4" />
        </Button>
      </a>
    );
  }

  return null;
}
