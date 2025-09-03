
'use client';

import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, Briefcase, Lightbulb, MessageSquareMore } from 'lucide-react';
import type { SavedJob } from '@/lib/schemas';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { GenerationType } from '@/app/page';


interface SavedJobsCarouselProps {
  savedJobs: SavedJob[];
  onLoadJob: (job: SavedJob) => void;
  onDeleteJob: (jobId: string) => void;
}

const iconMap: Record<GenerationType, React.ReactNode> = {
    coverLetter: <FileText className="h-4 w-4" title="Cover Letter" />,
    cv: <Briefcase className="h-4 w-4" title="CV" />,
    deepAnalysis: <Lightbulb className="h-4 w-4" title="Deep Analysis" />,
    qAndA: <MessageSquareMore className="h-4 w-4" title="Q & A" />,
};


export function SavedJobsCarousel({ savedJobs, onLoadJob, onDeleteJob }: SavedJobsCarouselProps) {
  if (savedJobs.length === 0) {
    return null;
  }
  
  const sortedJobs = [...savedJobs].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

  return (
    <div className='space-y-4'>
        <h2 className="text-2xl font-bold text-left">Your Saved Applications</h2>
        <Carousel
        opts={{
            align: 'start',
            loop: false,
        }}
        className="w-full"
        >
        <CarouselContent>
            {sortedJobs.map((job) => (
            <CarouselItem key={job.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                <Card className="h-full flex flex-col text-left">
                    <CardHeader>
                        <CardTitle className="truncate">{job.jobTitle}</CardTitle>
                        <CardDescription className='truncate'>{job.companyName}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            {Object.keys(job.allResults).map((key) => (
                                <span key={key}>{iconMap[key as GenerationType]}</span>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                            Saved {formatDistanceToNow(new Date(job.savedAt), { addSuffix: true })}
                        </p>
                    </CardContent>
                    <CardFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="w-full" onClick={() => onLoadJob(job)}>
                            <Download className="mr-2 h-4 w-4" />
                            Load
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="w-full">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the saved application for {job.jobTitle} at {job.companyName}. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Delete
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </CardFooter>
                </Card>
                </div>
            </CarouselItem>
            ))}
        </CarouselContent>
        <CarouselPrevious className='-left-4 hidden sm:flex' />
        <CarouselNext className='-right-4 hidden sm:flex' />
        </Carousel>
    </div>
  );
}
