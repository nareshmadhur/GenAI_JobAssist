'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Briefcase, 
  Clock, 
  ExternalLink, 
  FileCheck, 
  GripVertical,
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2,
  ArrowRight,
  Bot
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DndContext, PointerSensor, closestCenter, useDroppable, useSensor, useSensors, type DragEndEvent, type DraggableAttributes } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { JobStatus, SavedJob } from '@/lib/schemas';
import { formatDistanceToNow } from 'date-fns';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

type TrackerStatus = 'draft' | 'applied' | 'in_process' | 'accepted' | 'rejected';
type TrackerColumnKey = 'draft' | 'applied' | 'in_process' | 'final';

const STATUS_OPTIONS: { label: string; value: TrackerStatus; color: string }[] = [
  { label: 'Drafts', value: 'draft', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { label: 'Applied', value: 'applied', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { label: 'In Process', value: 'in_process', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { label: 'Accepted', value: 'accepted', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { label: 'Rejected', value: 'rejected', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

const KANBAN_COLUMNS: { label: string; value: TrackerColumnKey; color: string }[] = [
  { label: 'Drafts', value: 'draft', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { label: 'Applied', value: 'applied', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { label: 'In Process', value: 'in_process', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { label: 'Accepted / Rejected', value: 'final', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
];

const normalizeJobStatus = (status?: JobStatus): TrackerStatus => {
  switch (status) {
    case 'interviewing':
      return 'in_process';
    case 'offer':
      return 'accepted';
    case 'accepted':
    case 'rejected':
    case 'applied':
    case 'in_process':
      return status;
    case 'draft':
    default:
      return 'draft';
  }
};

const getStatusMeta = (status?: JobStatus) => {
  const normalized = normalizeJobStatus(status);
  return STATUS_OPTIONS.find((option) => option.value === normalized) || STATUS_OPTIONS[0];
};

function AdminPageContent() {
  const { savedJobs, setSavedJobs } = useAppContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [pendingClearStatus, setPendingClearStatus] = useState<TrackerStatus | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const source = searchParams.get('from');
  const sourceJobId = searchParams.get('jobId');

  const filteredJobs = savedJobs.filter(job => 
    job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const selectedJobCount = selectedJobIds.length;
  const pendingClearCount = pendingClearStatus
    ? filteredJobs.filter((job) => normalizeJobStatus(job.status) === pendingClearStatus).length
    : 0;

  useEffect(() => {
    const visibleJobIds = new Set(filteredJobs.map((job) => job.id));
    setSelectedJobIds((prev) => {
      const next = prev.filter((id) => visibleJobIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredJobs]);

  const updateJobStatus = (jobId: string, newStatus: TrackerStatus) => {
    setSavedJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  };

  const updateJobsStatus = (jobIds: string[], newStatus: TrackerStatus, options?: { clearSelection?: boolean }) => {
    if (jobIds.length === 0) return;

    setSavedJobs((prev) =>
      prev.map((job) => (jobIds.includes(job.id) ? { ...job, status: newStatus } : job))
    );

    if (options?.clearSelection) {
      setSelectedJobIds((prev) => prev.filter((id) => !jobIds.includes(id)));
    }
  };

  const deleteJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const deleteJobsByIds = (jobIds: string[]) => {
    if (jobIds.length === 0) return;

    setSavedJobs((prev) => prev.filter((job) => !jobIds.includes(job.id)));
    setSelectedJobIds((prev) => prev.filter((id) => !jobIds.includes(id)));
  };

  const clearJobsInStatus = (status: TrackerStatus) => {
    const jobIds = filteredJobs
      .filter((job) => normalizeJobStatus(job.status) === status)
      .map((job) => job.id);
    deleteJobsByIds(jobIds);
    setPendingClearStatus(null);
  };

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const clearSelection = () => {
    setSelectedJobIds([]);
  };

  const handleBack = () => {
    if (source === 'build' && sourceJobId) {
      router.push(`/job-matcher?jobId=${sourceJobId}`);
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/job-matcher');
  };

  const buildFlowHref = (jobId: string) => `/job-matcher?jobId=${jobId}`;

  const resolveStatusFromDropTarget = (targetId: string): TrackerStatus | null => {
    const directColumnMatch = STATUS_OPTIONS.find((column) => column.value === targetId);
    if (directColumnMatch) {
      return directColumnMatch.value;
    }

    const targetJob = savedJobs.find((job) => job.id === targetId);
    return normalizeJobStatus(targetJob?.status);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeJobId = String(active.id);
    const draggedJob = savedJobs.find((job) => job.id === activeJobId);
    if (!draggedJob) return;

    const nextStatus = resolveStatusFromDropTarget(String(over.id));
    if (!nextStatus) {
      return;
    }

    const affectedJobIds =
      selectedJobIds.includes(activeJobId) && selectedJobIds.length > 1
        ? selectedJobIds
        : [activeJobId];

    const hasAnyChange = affectedJobIds.some((jobId) => {
      const job = savedJobs.find((item) => item.id === jobId);
      return job && normalizeJobStatus(job.status) !== nextStatus;
    });

    if (!hasAnyChange) {
      return;
    }

    updateJobsStatus(affectedJobIds, nextStatus, {
      clearSelection: affectedJobIds.length > 1,
    });
  };

  const KanbanColumn = ({
    column,
    jobs,
  }: {
    column: typeof KANBAN_COLUMNS[number];
    jobs: SavedJob[];
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: column.value,
    });

    return (
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <span className={cn("h-1.5 w-1.5 rounded-full", column.color.split(' ')[1])} />
            {column.label}
          </h3>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px] h-5 bg-background border-muted-foreground/10 text-muted-foreground">
              {jobs.length}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              disabled={jobs.length === 0}
              onClick={() => setPendingClearStatus(column.value as TrackerStatus)}
              aria-label={`Remove all from ${column.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-[500px] flex-col gap-4 rounded-2xl bg-muted/40 p-3 border border-muted-foreground/5 shadow-inner transition-colors',
            isOver && 'border-primary/40 bg-primary/5'
          )}
        >
          <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
            {jobs.length > 0 ? (
              jobs.map((job) => <SortableJobCard key={job.id} job={job} />)
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-10 opacity-40">
                <div className="rounded-full border border-dashed border-muted-foreground/30 p-2 mb-2">
                  <FileCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[10px] font-medium text-muted-foreground italic">No Applications</p>
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    );
  };

  const FinalStatusLane = ({
    status,
    jobs,
  }: {
    status: TrackerStatus;
    jobs: SavedJob[];
  }) => {
    const meta = getStatusMeta(status);
    const { isOver, setNodeRef } = useDroppable({
      id: status,
    });

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {meta.label}
          </h4>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="h-5 text-[10px]">
              {jobs.length}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              disabled={jobs.length === 0}
              onClick={() => setPendingClearStatus(status)}
              aria-label={`Remove all from ${meta.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          ref={setNodeRef}
          className={cn(
            'flex min-h-[220px] flex-col gap-4 rounded-2xl border bg-background/70 p-3 transition-colors',
            isOver && 'border-primary/40 bg-primary/5'
          )}
        >
          <SortableContext items={jobs.map((job) => job.id)} strategy={verticalListSortingStrategy}>
            {jobs.length > 0 ? (
              jobs.map((job) => <SortableJobCard key={job.id} job={job} />)
            ) : (
              <div className="flex flex-1 items-center justify-center py-8 text-[10px] italic text-muted-foreground opacity-50">
                No Applications
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    );
  };

  const JobCard = ({
    job,
    dragAttributes,
    dragListeners,
    isDragging = false,
    isSelected = false,
    onToggleSelect,
  }: {
    job: SavedJob;
    dragAttributes?: DraggableAttributes;
    dragListeners?: SyntheticListenerMap;
    isDragging?: boolean;
    isSelected?: boolean;
    onToggleSelect: (jobId: string) => void;
  }) => (
    <Card className={cn(
      'group relative overflow-hidden transition-all hover:shadow-md border-muted-foreground/10 bg-card/50 backdrop-blur-sm',
      isDragging && 'shadow-xl ring-2 ring-primary/20',
      isSelected && 'border-primary/40 bg-primary/5 ring-2 ring-primary/20'
    )}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
              {job.jobTitle}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> {job.companyName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(job.id)}
              onClick={(event) => event.stopPropagation()}
              aria-label={`Select ${job.jobTitle}`}
              className="border-muted-foreground/30"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-grab active:cursor-grabbing opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
              aria-label={`Drag ${job.jobTitle}`}
              {...dragAttributes}
              {...dragListeners}
            >
              <GripVertical className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={buildFlowHref(job.id)} className="flex items-center">
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in Build Flow
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground py-1">Move to</DropdownMenuLabel>
                {STATUS_OPTIONS.map(col => (
                  <DropdownMenuItem 
                    key={col.value} 
                    onClick={() => updateJobStatus(job.id, col.value)}
                    disabled={normalizeJobStatus(job.status) === col.value}
                  >
                    {col.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardFooter className="p-4 pt-2 flex items-center justify-between">
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(job.savedAt), { addSuffix: true })}
        </div>
        <div className="flex gap-1">
           {job.allResults.cv && <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-success/10 text-success border-success/20">CV</Badge>}
           {job.allResults.coverLetter && <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-primary/10 text-primary border-primary/20">CL</Badge>}
        </div>
      </CardFooter>
    </Card>
  );

  const SortableJobCard = ({ job }: { job: SavedJob }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: job.id,
    });

    return (
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
      >
        <JobCard
          job={job}
          dragAttributes={attributes}
          dragListeners={listeners}
          isDragging={isDragging}
          isSelected={selectedJobIds.includes(job.id)}
          onToggleSelect={toggleJobSelection}
        />
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 w-full border-b border-b-accent/20 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 group">
            <AiJobAssistLogo className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">AI Job Assist</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">App Tracker</span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/job-matcher">Build Your Application</Link>
            </Button>
            <ThemeToggleButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
        <div className="flex flex-col gap-8">
          {/* Dashboard Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button variant="ghost" size="sm" className="-ml-2 mb-3 w-fit" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="font-headline text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Application Tracker
              </h1>
              <p className="text-muted-foreground">
                Manage your job pipeline and track your progress through the hiring cycle.
              </p>
            </div>
            <Button asChild className="shadow-lg shadow-primary/20">
              <Link href="/job-matcher">
                <Plus className="mr-2 h-4 w-4" /> New Application
              </Link>
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by company or role..." 
                className="pl-10 bg-background/50 border-muted-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="grid w-full grid-cols-2 rounded-lg border border-muted-foreground/20 bg-background/50 p-1 sm:flex sm:w-auto sm:items-center">
                <Button 
                  variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 px-3"
                  onClick={() => setViewMode('kanban')}
                >
                  <LayoutGrid className="mr-2 h-4 w-4" /> Kanban
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="h-8 px-3"
                  onClick={() => setViewMode('list')}
                >
                  <List className="mr-2 h-4 w-4" /> List
                </Button>
              </div>
            </div>
          </div>

          {viewMode === 'kanban' && selectedJobCount > 0 ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedJobCount} application{selectedJobCount > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Move them together, then clear the selection when you&apos;re done.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm">
                        Move selected
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Move selected to</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() =>
                            updateJobsStatus(selectedJobIds, option.value, {
                              clearSelection: true,
                            })
                          }
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {savedJobs.length === 0 ? (
             <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-card/30 p-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">Your Pipeline is Empty</h3>
                <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Start by building an application. We&apos;ll track your resume, cover letter, answers, and status right here.
                </p>
                <Button asChild size="lg" className="mt-8 shadow-xl shadow-primary/25">
                  <Link href="/job-matcher">Build Your Application <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
             </div>
          ) : (
            <div className="w-full">
              {viewMode === 'kanban' ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2 xl:grid-cols-4">
                    {KANBAN_COLUMNS.map((column) => {
                      if (column.value === 'final') {
                        const acceptedJobs = filteredJobs.filter((job) => normalizeJobStatus(job.status) === 'accepted');
                        const rejectedJobs = filteredJobs.filter((job) => normalizeJobStatus(job.status) === 'rejected');

                        return (
                          <div key={column.value} className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-2">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <span className={cn("h-1.5 w-1.5 rounded-full", column.color.split(' ')[1])} />
                                {column.label}
                              </h3>
                              <Badge variant="outline" className="text-[10px] h-5 bg-background border-muted-foreground/10 text-muted-foreground">
                                {acceptedJobs.length + rejectedJobs.length}
                              </Badge>
                            </div>
                            <div className="grid gap-4">
                              <FinalStatusLane status="accepted" jobs={acceptedJobs} />
                              <FinalStatusLane status="rejected" jobs={rejectedJobs} />
                            </div>
                          </div>
                        );
                      }

                      const jobsInColumn = filteredJobs.filter((job) => normalizeJobStatus(job.status) === column.value);
                      return <KanbanColumn key={column.value} column={column} jobs={jobsInColumn} />;
                    })}
                  </div>
                </DndContext>
              ) : (
                <Card className="border-muted-foreground/10 bg-card/50 backdrop-blur-sm overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-muted-foreground/10 bg-muted/30">
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Company & Role</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Artifacts</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Date Saved</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredJobs.length > 0 ? (
                            filteredJobs.map(job => (
                              <tr key={job.id} className="border-b border-muted-foreground/5 transition-colors hover:bg-muted/30 group">
                                <td className="p-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{job.jobTitle}</span>
                                    <span className="text-xs text-muted-foreground">{job.companyName}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <Badge className={cn("text-[10px] py-0 h-6", getStatusMeta(job.status).color)}>
                                    {getStatusMeta(job.status).label}
                                  </Badge>
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                     {job.allResults.cv && <Badge variant="secondary" className="bg-success/5 text-success border-success/10 text-[9px]">ATS CV</Badge>}
                                     {job.allResults.coverLetter && <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px]">CL</Badge>}
                                  </div>
                                </td>
                                <td className="p-4 text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(job.savedAt), { addSuffix: true })}
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button asChild variant="ghost" size="sm" className="h-8 px-3 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                      <Link href={buildFlowHref(job.id)}>Open Build Flow</Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" onClick={() => deleteJob(job.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-12 text-center text-muted-foreground italic">
                                No applications found matching your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                   </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={pendingClearStatus !== null} onOpenChange={(open) => !open && setPendingClearStatus(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all from this section?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingClearStatus
                ? `This will remove ${pendingClearCount} application${pendingClearCount === 1 ? '' : 's'} from ${getStatusMeta(pendingClearStatus).label}.`
                : 'This action will remove the applications in this section.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingClearStatus) {
                  clearJobsInStatus(pendingClearStatus);
                }
              }}
            >
              Remove all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdminPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-8">
      <div className="text-sm text-muted-foreground">Loading application tracker...</div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageFallback />}>
      <AdminPageContent />
    </Suspense>
  );
}
