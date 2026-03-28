'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/circular-progress';
import type { InterviewPrepOutput } from '@/lib/schemas';

interface InterviewPrepViewProps {
  data: InterviewPrepOutput;
}

export function InterviewPrepView({ data }: InterviewPrepViewProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(0);
  const [showNegotiation, setShowNegotiation] = useState(false);

  const scoreColor =
    data.overallReadinessScore >= 80
      ? 'text-emerald-500'
      : data.overallReadinessScore >= 60
      ? 'text-amber-500'
      : 'text-rose-500';

  const scoreLabel =
    data.overallReadinessScore >= 80
      ? 'Strong Match'
      : data.overallReadinessScore >= 60
      ? 'Good Match'
      : data.overallReadinessScore >= 40
      ? 'Moderate Match'
      : 'Significant Gaps';

  return (
    <div className="space-y-6">
      {/* Readiness Score */}
      <Card className="border-none bg-gradient-to-br from-primary/10 via-card to-accent/5 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center shrink-0">
              <CircularProgress value={data.overallReadinessScore} size={80} strokeWidth={6} />
              <Badge variant="outline" className={`mt-2 text-xs font-bold border-none ${scoreColor}`}>
                {scoreLabel}
              </Badge>
            </div>
            <div className="flex flex-col justify-center pt-1">
              <h3 className="text-base font-bold text-foreground mb-1">Interview Readiness</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{data.readinessSummary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Lead With These ({data.strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <p className="text-sm text-foreground">{s}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gaps with bridging tips */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Bridge These Gaps ({data.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.gaps.map((gap, i) => (
              <div key={i} className="space-y-1">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{gap.skill}</p>
                <p className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-amber-400/40">{gap.tip}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Likely Questions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MessageSquare className="h-4 w-4 text-primary" />
            Likely Interview Questions ({data.likelyQuestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.likelyQuestions.map((q, i) => (
            <div
              key={i}
              className="rounded-lg border border-muted-foreground/10 bg-muted/30 overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedQuestion(expandedQuestion === i ? null : i)}
              >
                <span className="text-sm font-medium text-foreground pr-4">{q.question}</span>
                {expandedQuestion === i ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {expandedQuestion === i && (
                <div className="px-3 pb-3 space-y-3 border-t border-muted-foreground/10">
                  <div className="pt-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Coaching Angle</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{q.coachingAngle}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <BookOpen className="h-3 w-3 text-accent" />
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">Story to Draw From</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">{q.storyPrompt}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Negotiation Tips — collapsible */}
      <Card className="border-primary/20">
        <button
          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
          onClick={() => setShowNegotiation(!showNegotiation)}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Negotiation Leverage</span>
            <Badge variant="secondary" className="text-xs">{data.negotiationTips.length} tips</Badge>
          </div>
          {showNegotiation ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showNegotiation && (
          <CardContent className="space-y-2 pt-0">
            {data.negotiationTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{tip}</p>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
