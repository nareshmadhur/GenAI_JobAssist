
import React from 'react';

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number;
  className?: string;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  indicatorClassName?: string;
  valueClassName?: string;
}

/**
 * A circular progress bar component.
 *
 * @param {CircularProgressProps} props - The component props.
 * @returns {JSX.Element} The rendered circular progress component.
 */
export function CircularProgress({
  value,
  className,
  size = 100,
  strokeWidth = 10,
  trackClassName,
  indicatorClassName,
  valueClassName,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className={cn('text-muted', trackClassName)}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          className={cn('text-accent', indicatorClassName)}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-xl font-bold text-foreground', valueClassName)}>{`${value}%`}</span>
      </div>
    </div>
  );
}
