'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  Gauge,
  Loader2,
  RefreshCcw,
  Users,
} from 'lucide-react';

import { AiJobAssistLogo } from '@/components/ai-job-assist-logo';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/app-context';
import { getAnalyticsEventLabel, getOwnerUids, isOwnerUid, type AnalyticsEventRecord } from '@/lib/analytics';
import { getAnalyticsEvents as fetchAnalyticsEvents } from '@/lib/firestore-service';

const GENERATION_EVENTS = new Set([
  'fit_summary_generated',
  'resume_generated',
  'cover_letter_generated',
  'answers_generated',
]);

function OwnerAnalyticsPage() {
  const { user, authLoading } = useAuth();
  const [events, setEvents] = useState<AnalyticsEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ownerUids = getOwnerUids();
  const isOwner = isOwnerUid(user?.uid);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextEvents = await fetchAnalyticsEvents(1000);
      setEvents(nextEvents);
    } catch (nextError: any) {
      console.error('Failed to load analytics events:', nextError);
      setError(nextError?.message || 'Could not load analytics data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !isOwner) {
      setIsLoading(false);
      return;
    }

    void loadAnalytics();
  }, [authLoading, isOwner, user]);

  const analyticsSummary = useMemo(() => {
    const uniqueUsers = new Set(events.map((event) => event.userId));
    const uniqueSessions = new Set(events.map((event) => event.sessionId));
    const buildSessions = new Set(
      events.filter((event) => event.eventName === 'continue_to_build').map((event) => event.sessionId)
    );
    const generationSessions = new Set(
      events.filter((event) => GENERATION_EVENTS.has(event.eventName)).map((event) => event.sessionId)
    );
    const savedCount = events.filter((event) => event.eventName === 'application_saved').length;
    const coachCount = events.filter(
      (event) => event.eventName === 'coach_opened' || event.eventName === 'coach_prompt_used'
    ).length;
    const importSuccessCount = events.filter((event) => event.eventName === 'job_url_import_success').length;
    const importFailCount = events.filter((event) => event.eventName === 'job_url_import_failed').length;
    const printCount = events.filter(
      (event) => event.eventName === 'resume_printed' || event.eventName === 'cover_letter_printed'
    ).length;

    const eventCounts = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1;
      return acc;
    }, {});

    const sectionCounts = [
      { label: 'Fit Summary', value: eventCounts.fit_summary_generated || 0 },
      { label: 'Resume', value: eventCounts.resume_generated || 0 },
      { label: 'Cover Letter', value: eventCounts.cover_letter_generated || 0 },
      { label: 'Answers', value: eventCounts.answers_generated || 0 },
    ];

    const buildToGenerationRate =
      buildSessions.size > 0 ? Math.round((generationSessions.size / buildSessions.size) * 100) : 0;
    const importSuccessRate =
      importSuccessCount + importFailCount > 0
        ? Math.round((importSuccessCount / (importSuccessCount + importFailCount)) * 100)
        : 0;

    return {
      totalEvents: events.length,
      uniqueUsers: uniqueUsers.size,
      uniqueSessions: uniqueSessions.size,
      buildSessions: buildSessions.size,
      generationSessions: generationSessions.size,
      buildToGenerationRate,
      savedCount,
      coachCount,
      importSuccessCount,
      importFailCount,
      importSuccessRate,
      printCount,
      sectionCounts,
      topEvents: Object.entries(eventCounts)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 8),
      recentEvents: events.slice(0, 20),
    };
  }, [events]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (ownerUids.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Owner Analytics Needs Setup</CardTitle>
            <CardDescription>
              Add `NEXT_PUBLIC_OWNER_UIDS` to your environment before using this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/job-matcher">Back to Build Flow</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Owner Access Only</CardTitle>
            <CardDescription>
              This analytics area is restricted to the configured owner account.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <header className="sticky top-0 z-10 w-full border-b border-b-accent/20 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 group">
            <AiJobAssistLogo className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">AI Job Assist</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Owner Analytics
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/job-matcher">Build Your Application</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:flex">
              <Link href="/tracker">Application Tracker</Link>
            </Button>
            <ThemeToggleButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 w-fit">
                <Link href="/tracker">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Tracker
                </Link>
              </Button>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                Owner Analytics
              </h1>
              <p className="text-muted-foreground">
                Usage signals from signed-in users across the build flow, tracker, imports, coach, and export actions.
              </p>
            </div>
            <Button onClick={() => void loadAnalytics()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
          </div>

          {error ? (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Unique Users',
                value: analyticsSummary.uniqueUsers,
                description: 'Signed-in users with tracked events',
                icon: Users,
              },
              {
                label: 'Build Sessions',
                value: analyticsSummary.buildSessions,
                description: `${analyticsSummary.buildToGenerationRate}% reached a generation action`,
                icon: Gauge,
              },
              {
                label: 'Applications Saved',
                value: analyticsSummary.savedCount,
                description: 'New applications persisted to the tracker',
                icon: CheckCircle2,
              },
              {
                label: 'Exports',
                value: analyticsSummary.printCount,
                description: `${analyticsSummary.importSuccessRate}% job URL import success rate`,
                icon: FileText,
              },
            ].map((metric) => (
              <Card key={metric.label}>
                <CardContent className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">{metric.value}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{metric.description}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <metric.icon className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Feature Usage
                </CardTitle>
                <CardDescription>
                  Which parts of the application people are generating most often.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsSummary.sectionCounts.map((item) => {
                  const maxValue = Math.max(...analyticsSummary.sectionCounts.map((section) => section.value), 1);
                  const width = `${Math.max(8, Math.round((item.value / maxValue) * 100))}%`;

                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{item.label}</span>
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Top Events
                </CardTitle>
                <CardDescription>
                  The most common tracked actions in the current sample.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analyticsSummary.topEvents.map(([eventName, count]) => (
                  <div key={eventName} className="flex items-center justify-between rounded-xl border bg-background/70 px-3 py-2">
                    <span className="text-sm text-foreground">{getAnalyticsEventLabel(eventName as any)}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest analytics events from signed-in users.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : analyticsSummary.recentEvents.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No analytics events yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-muted-foreground/10">
                        <th className="p-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Event</th>
                        <th className="p-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">User</th>
                        <th className="p-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Route</th>
                        <th className="p-3 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsSummary.recentEvents.map((event) => (
                        <tr key={event.id} className="border-b border-muted-foreground/5">
                          <td className="p-3 text-sm font-medium text-foreground">
                            {getAnalyticsEventLabel(event.eventName)}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {event.userEmail || event.userId}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{event.route}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {event.createdAt
                              ? formatDistanceToNow(event.createdAt, { addSuffix: true })
                              : 'Pending timestamp'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default OwnerAnalyticsPage;
