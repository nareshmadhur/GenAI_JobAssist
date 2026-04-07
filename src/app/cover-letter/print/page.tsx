'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CoverLetterPrintTemplate } from '@/components/cover-letter-print-template';
import {
  clearCoverLetterPrintExport,
  readCoverLetterPrintExport,
  type CoverLetterPrintExportPayload,
} from '@/lib/cover-letter-export';

function CoverLetterPrintView() {
  const searchParams = useSearchParams();
  const [exportPayload, setExportPayload] = useState<CoverLetterPrintExportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedExportRef = useRef(false);
  const exportId = useMemo(() => searchParams.get('exportId'), [searchParams]);

  useEffect(() => {
    if (!exportId || hasLoadedExportRef.current) {
      return;
    }

    hasLoadedExportRef.current = true;

    try {
      const exportData = readCoverLetterPrintExport(exportId);
      if (!exportData) {
        setError('Could not load this cover letter export. Please try exporting again from the application.');
        return;
      }
      setExportPayload(exportData);
      clearCoverLetterPrintExport(exportId);
    } catch (e) {
      console.error('Failed to parse cover letter export data', e);
      setError('Could not load cover letter data. Please try exporting again.');
    }
  }, [exportId]);

  useEffect(() => {
    if (exportPayload) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [exportPayload]);

  if (error) {
    return <div className="p-10 text-center font-medium text-rose-500">{error}</div>;
  }

  if (!exportPayload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/20 p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-sm">
            <FileText className="h-10 w-10" />
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground">Cover Letter Studio</h1>
          <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
            Build a tailored cover letter to see it formatted and ready for printing here.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
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
    <div className="min-h-screen overflow-y-auto bg-muted/30 px-4 py-8 print:bg-white print:p-0">
      <CoverLetterPrintTemplate coverLetter={exportPayload.coverLetter} />
    </div>
  );
}

function CoverLetterPrintSkeleton() {
  return (
    <div className="p-8">
      <Skeleton className="mb-4 h-8 w-1/2" />
      <Skeleton className="mb-8 h-4 w-1/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function CoverLetterPrintPage() {
  return (
    <Suspense fallback={<CoverLetterPrintSkeleton />}>
      <CoverLetterPrintView />
    </Suspense>
  );
}
