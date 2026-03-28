
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CvOutput } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';
import { readCvPrintExport } from '@/lib/cv-export';
import { CvPrintTemplate } from '@/components/cv-print-template';

/**
 * The actual view that uses search params and needs to be suspended.
 */
function PrintView() {
  const searchParams = useSearchParams();
  const [cvData, setCvData] = useState<CvOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const exportId = searchParams.get('exportId');
    if (exportId) {
      try {
        const exportData = readCvPrintExport(exportId);
        if (!exportData) {
          setError('Could not load this resume export. Please try exporting again from the application.');
          return;
        }
        setCvData(exportData);
      } catch (e) {
        console.error('Failed to parse CV data', e);
        setError('Could not load CV data. Please try exporting again.');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (cvData) {
      // Give the browser a moment to render the content before printing
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [cvData]);

  if (error) {
    return <div className="p-10 text-center text-rose-500 font-medium">{error}</div>;
  }

  if (!cvData) {
    return (
       <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-muted/20">
         <div className="max-w-md text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mx-auto mb-8 shadow-sm">
              <FileText className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4 text-foreground">Resume Studio</h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Build your first tailored resume to see it beautifully formatted and ready for export here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button asChild size="lg" className="h-12 px-8 shadow-xl shadow-primary/25">
                <Link href="/job-matcher">Build Your Application</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link>
              </Button>
            </div>
         </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 print:p-0 print:bg-white overflow-y-auto">
      <CvPrintTemplate cvData={cvData} />
    </div>
  );
}

/**
 * A skeleton component to use as a fallback for Suspense.
 */
function CvPrintSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-4 w-1/4 mb-8" />
      <Skeleton className="h-24 w-full mb-8" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

/**
 * The main page component that wraps the client-side logic in a Suspense boundary.
 */
function CvPrintPage() {
  return (
    <Suspense fallback={<CvPrintSkeleton />}>
      <PrintView />
    </Suspense>
  );
}

export default CvPrintPage;
