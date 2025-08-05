
'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CvView } from '@/components/cv-view';
import type { CvOutput } from '@/lib/schemas';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The actual view that uses search params and needs to be suspended.
 */
function PrintView() {
  const searchParams = useSearchParams();
  const [cvData, setCvData] = useState<CvOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedData = JSON.parse(atob(data));
        setCvData(decodedData);
      } catch (e) {
        console.error('Failed to parse CV data', e);
        setError('Could not load CV data. Please try exporting again.');
      }
    } else {
      setError('No CV data provided.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (cvData) {
      // Give the browser a moment to render the content before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cvData]);

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>;
  }

  if (!cvData) {
    // This state is effectively the loading state before useEffect runs
    return <CvPrintSkeleton />;
  }

  // A dummy onCvUpdate function as it's not needed on the print page.
  const handleCvUpdate = () => {};

  return (
    <div className="print-container bg-white">
      <CvView cvData={cvData} onCvUpdate={handleCvUpdate} isPrintView />
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
