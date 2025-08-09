
'use client';

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Contact,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Loader2,
} from 'lucide-react';

import type { BioCompletenessOutput } from '@/lib/schemas';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BioProgressTrackerProps {
  analysis: BioCompletenessOutput | null;
  isLoading: boolean;
}

const checklistItems = [
  {
    key: 'hasContactInfo',
    label: 'Contact Info',
    icon: <Contact className="h-5 w-5" />,
  },
  { key: 'hasSummary', label: 'Summary', icon: <FileText className="h-5 w-5" /> },
  {
    key: 'hasWorkExperience',
    label: 'Experience',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    key: 'hasEducation',
    label: 'Education',
    icon: <GraduationCap className="h-5 w-5" />,
  },
  { key: 'hasSkills', label: 'Skills', icon: <Wrench className="h-5 w-5" /> },
];

/**
 * A component to display the completeness of a user's bio.
 */
export function BioProgressTracker({
  analysis,
  isLoading,
}: BioProgressTrackerProps) {
  const completedCount = analysis
    ? Object.values(analysis).filter(Boolean).length
    : 0;
  const totalCount = checklistItems.length;
  const progressPercentage =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Bio Completeness</h4>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount} / {totalCount}
          </span>
        )}
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-5">
        <TooltipProvider>
          {checklistItems.map((item) => {
            const isCompleted = analysis?.[item.key as keyof BioCompletenessOutput] ?? false;
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        isCompleted
                          ? 'bg-green-100 text-green-600'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        item.icon
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    </div>
  );
}
