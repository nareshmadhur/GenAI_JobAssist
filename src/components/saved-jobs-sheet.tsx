'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { List, Briefcase, Trash2, Download } from 'lucide-react';
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


interface SavedJobsSheetProps {
  savedJobs: SavedJob[];
  onLoadJob: (job: SavedJob) => void;
  onDeleteJob: (jobId: string) => void;
}

export function SavedJobsSheet({ savedJobs, onLoadJob, onDeleteJob }: SavedJobsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="View Saved Jobs">
          <List className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Saved Applications</SheetTitle>
          <SheetDescription>
            Here are your saved job applications. You can load or delete them.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
          {savedJobs.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>You have no saved jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedJobs.sort((a,b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((job) => (
                <div key={job.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{job.jobTitle}</h3>
                      <p className="text-sm text-muted-foreground">{job.companyName}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        Saved {formatDistanceToNow(new Date(job.savedAt), { addSuffix: true })}
                      </p>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
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
                  </div>
                  <SheetFooter className="mt-4">
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full" onClick={() => onLoadJob(job)}>
                        <Download className="mr-2 h-4 w-4" />
                        Load Application
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
