
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
import { List, Briefcase, Trash2, Download, ExternalLink } from 'lucide-react';
import type { SavedRepository } from '@/lib/schemas';
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
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


interface SavedRepositoriesSheetProps {
  savedRepositories: SavedRepository[];
  onLoadRepository: (repo: SavedRepository) => void;
  onDeleteRepository: (repoId: string) => void;
  children?: React.ReactNode;
}

export function SavedRepositoriesSheet({ savedRepositories, onLoadRepository, onDeleteRepository, children }: SavedRepositoriesSheetProps) {
  const router = useRouter();
  const { toast } = useToast();

  const handleUseForJob = (repo: SavedRepository) => {
    try {
        const LOCAL_STORAGE_KEY_BIO_FORM = 'ai_job_assist_form_data';
        const existingDataRaw = localStorage.getItem(LOCAL_STORAGE_KEY_BIO_FORM);
        const existingData = existingDataRaw ? JSON.parse(existingDataRaw) : {};
        // Map legacy 'bio' to 'workRepository' from the repository object if needed
        const repoContent = repo.workRepository || (repo as any).bio || '';
        const dataToSave = { ...existingData, workRepository: repoContent };
        localStorage.setItem(LOCAL_STORAGE_KEY_BIO_FORM, JSON.stringify(dataToSave));
        toast({ title: 'Repository Loaded!', description: 'Redirecting you to the Job Matcher...' });
        router.push('/job-matcher');
    } catch (e) {
        console.error('Failed to save repository for Job Matcher', e);
        toast({ variant: 'destructive', title: 'Could not load data.' });
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children ? (
          <div className="w-full">{children}</div>
        ) : (
          <Button variant="outline" size="icon" aria-label="View Saved Bios">
            <List className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Saved Repositories</SheetTitle>
          <SheetDescription>
            Your collections of work history, skills, and projects.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-4 -mr-4">
          {savedRepositories.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>You have no saved repositories yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedRepositories.sort((a,b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((repo) => (
                <div key={repo.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{repo.name}</h3>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        Saved {formatDistanceToNow(new Date(repo.savedAt), { addSuffix: true })}
                      </p>
                    </div>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &quot;{repo.name}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteRepository(repo.id)} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <SheetFooter className="flex flex-col sm:flex-row gap-2">
                     <SheetClose asChild>
                      <Button variant="secondary" className="w-full" onClick={() => onLoadRepository(repo)}>
                        <Download className="mr-2 h-4 w-4" />
                        Load in Editor
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                       <Button variant="default" className="w-full" onClick={() => handleUseForJob(repo)}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Use in Studio
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
