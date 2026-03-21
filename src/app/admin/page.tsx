'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  ChevronRight, 
  Clock, 
  ExternalLink, 
  FileCheck, 
  FileText, 
  Filter, 
  LayoutGrid, 
  List, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2,
  ArrowRight,
  Bot
} from 'lucide-react';
import { useAppContext, useAuth } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { JobStatus, SavedJob } from '@/lib/schemas';
import { formatDistanceToNow } from 'date-fns';
import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

const STATUS_COLUMNS: { label: string; value: JobStatus; color: string }[] = [
  { label: 'Drafts', value: 'draft', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  { label: 'Applied', value: 'applied', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
  { label: 'Interviewing', value: 'interviewing', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { label: 'Offers', value: 'offer', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { label: 'Closed', value: 'rejected', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
];

export default function AdminPage() {
  const { savedJobs, setSavedJobs } = useAppContext();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const filteredJobs = savedJobs.filter(job => 
    job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateJobStatus = (jobId: string, newStatus: JobStatus) => {
    setSavedJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  };

  const deleteJob = (jobId: string) => {
    setSavedJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const JobCard = ({ job }: { job: SavedJob }) => (
    <Card key={job.id} className="group relative overflow-hidden transition-all hover:shadow-md border-muted-foreground/10 bg-card/50 backdrop-blur-sm">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/job-matcher?jobId=${job.id}`} className="flex items-center">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open in Studio
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground py-1">Move to</DropdownMenuLabel>
              {STATUS_COLUMNS.map(col => (
                <DropdownMenuItem 
                  key={col.value} 
                  onClick={() => updateJobStatus(job.id, col.value)}
                  disabled={job.status === col.value || (!job.status && col.value === 'draft')}
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
              <Link href="/job-matcher">Application Studio</Link>
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
              <div className="flex items-center rounded-lg border border-muted-foreground/20 bg-background/50 p-1">
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

          {savedJobs.length === 0 ? (
             <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-card/30 p-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-sm">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-foreground">Your Pipeline is Empty</h3>
                <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Start by creating an application in the Studio. We'll track your resumes, cover letters, and status right here.
                </p>
                <Button asChild size="lg" className="mt-8 shadow-xl shadow-primary/25">
                  <Link href="/job-matcher">Go to Application Studio <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
             </div>
          ) : (
            <div className="w-full">
              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-start overflow-x-auto pb-4">
                  {STATUS_COLUMNS.map(column => {
                    const jobsInColumn = filteredJobs.filter(job => 
                      (job.status || 'draft') === column.value
                    );

                    return (
                      <div key={column.value} className="flex flex-col gap-4 min-w-[240px]">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className={cn("h-1.5 w-1.5 rounded-full", column.color.split(' ')[1])} />
                            {column.label}
                          </h3>
                          <Badge variant="outline" className="text-[10px] h-5 bg-background border-muted-foreground/10 text-muted-foreground">
                            {jobsInColumn.length}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-4 min-h-[500px] rounded-2xl bg-muted/40 p-3 border border-muted-foreground/5 shadow-inner">
                          {jobsInColumn.length > 0 ? (
                            jobsInColumn.map(job => <JobCard key={job.id} job={job} />)
                          ) : (
                            <div className="flex flex-1 flex-col items-center justify-center py-10 opacity-40">
                              <div className="rounded-full border border-dashed border-muted-foreground/30 p-2 mb-2">
                                <FileCheck className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <p className="text-[10px] font-medium text-muted-foreground italic">No Applications</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                                  <Badge className={cn("text-[10px] py-0 h-6", STATUS_COLUMNS.find(c => c.value === (job.status || 'draft'))?.color)}>
                                    {(STATUS_COLUMNS.find(c => c.value === (job.status || 'draft'))?.label)}
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
                                    <Button asChild variant="ghost" size="sm" className="h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Link href={`/job-matcher?jobId=${job.id}`}>Open Studio</Link>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteJob(job.id)}>
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
    </div>
  );
}

