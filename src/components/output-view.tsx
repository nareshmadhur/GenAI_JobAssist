
'use client';

import {
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Edit,
  FileText,
  GraduationCap,
  Lightbulb,
  MessageSquareMore,
  Save,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import React, { Fragment, useEffect, useState, useTransition } from 'react';
import ReactMarkdown from 'react-markdown';
import { compiler } from 'markdown-to-jsx';
import ReactDOMServer from 'react-dom/server';
import { useFormContext } from 'react-hook-form';

import { reviseAction, fillQaGapAction, generateInterviewPrepAction } from '@/app/actions';
import type { AllGenerationResults } from '@/app/actions';
import type { GenerationType, ActiveView } from '@/app/job-matcher/page';
import type { InterviewPrepOutput } from '@/lib/schemas';
import { InterviewPrepView } from '@/components/interview-prep-view';
import { LoadingProgress } from './loading-progress';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import { useToast } from '@/hooks/use-toast';
import type { CvOutput, QAndAOutput, ReviseResponseData, JobApplicationData } from '@/lib/schemas';
import type { DeepAnalysisOutput } from '@/lib/schemas';
import { Button } from './ui/button';
import { CvView } from './cv-view';
import { RevisionForm } from './revision-form';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { CircularProgress } from './circular-progress';
import { ErrorDisplay } from './error-display';
import { Skeleton } from './ui/skeleton';

interface OutputViewProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  allResults: AllGenerationResults;
  setAllResults: React.Dispatch<React.SetStateAction<AllGenerationResults>>;
  isGenerating: boolean;
  generationError: string | null;
  onRetry: () => void;
  showSectionSwitcher?: boolean;
  headerDescription?: string;
  headerActions?: React.ReactNode;
  onCoachRequest?: (message: string) => void;
  isActiveViewStale?: boolean;
}

const VIEW_CONFIG: Record<
  GenerationType,
  { title: string; icon: React.ReactNode }
> = {
  coverLetter: { title: 'Cover Letter', icon: <FileText className="h-5 w-5" /> },
  cv: { title: 'Resume', icon: <Briefcase className="h-5 w-5" /> },
  deepAnalysis: {
    title: 'Fit Summary',
    icon: <Lightbulb className="h-5 w-5" />,
  },
  qAndA: { title: 'Answers', icon: <MessageSquareMore className="h-5 w-5" /> },
};

/**
 * A utility component to provide a copy-to-clipboard button.
 *
 * @param {{ textToCopy: string, className?: string }} props - The component props.
 * @returns {JSX.Element} The rendered copy button.
 */
function CopyButton({
  textToCopy,
  className,
}: {
  textToCopy: string;
  className?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    const plainText = textToCopy.replace(/[*_#]/g, '');

    try {
      const reactElement = compiler(textToCopy, { forceBlock: true });
      const html = ReactDOMServer.renderToString(reactElement);

      const blobHtml = new Blob([html], { type: 'text/html' });
      const blobText = new Blob([plainText], { type: 'text/plain' });

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': blobHtml,
          'text/plain': blobText,
        }),
      ]);

      setIsCopied(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error(
        'Failed to copy rich text, falling back to plain text:',
        err
      );
      navigator.clipboard.writeText(plainText).then(
        () => {
          setIsCopied(true);
          toast({ title: 'Copied as plain text!' });
          setTimeout(() => setIsCopied(false), 2000);
        },
        () => {
          toast({
            variant: 'destructive',
            title: 'Copy failed',
            description: 'Could not write to clipboard.',
          });
        }
      );
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      aria-label="Copy text"
      className={className}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function MissingAnswerResolver({
  question,
  jobDescription,
  onResolve,
}: {
  question: string;
  jobDescription: string;
  onResolve: (answer: string) => void;
}) {
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!context.trim()) return;
    setIsGenerating(true);
    const result = await fillQaGapAction({
      jobDescription,
      question,
      userContext: context,
    });
    setIsGenerating(false);

    if (result && 'error' in result && result.error) {
      toast({ title: 'Generation Failed', description: result.error, variant: 'destructive' });
    } else if (result && 'answer' in result) {
      onResolve(result.answer);
      toast({ title: 'Answer Generated!' });
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md bg-orange-50 p-3 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30">
        <p className="text-xs font-medium text-orange-800 dark:text-orange-400">
            Missing Context. Provide a brief detail to generate an answer:
        </p>
        <div className="flex gap-2">
            <Input 
                placeholder="E.g. I used React for 3 years at Acme Corp..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                disabled={isGenerating}
                className="h-8 bg-white dark:bg-slate-900 w-full text-xs"
            />
            <Button size="sm" className="h-8 px-3 shrink-0" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                Generate
            </Button>
        </div>
    </div>
  );
}

/**
 * Renders the generated cover letter with editing and revision capabilities.
 *
 * @param {{ initialValue: string, onRevision: (data: ReviseResponseData) => Promise<void>, onValueChange: (value: string) => void }} props - The component props.
 * @returns {JSX.Element} The rendered cover letter view.
 */
function GeneratedResponseView({
  initialValue,
  onRevision,
  onValueChange,
}: {
  initialValue: string;
  onRevision: (data: ReviseResponseData) => Promise<void>;
  onValueChange: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);

  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    onValueChange(localValue);
    setIsEditing(false);
  };

  return (
    <div className="relative">
      {isEditing ? (
        <>
          <Textarea
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            className="min-h-[250px] bg-background"
            aria-label="Generated Response"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            className="absolute right-2 top-2"
          >
            <Save className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <div className="prose prose-sm relative min-h-[150px] max-w-none rounded-md border bg-background p-4 dark:prose-invert whitespace-pre-wrap">
          <ReactMarkdown>{localValue}</ReactMarkdown>
          <div className="absolute right-0 top-0 flex">
            <CopyButton textToCopy={localValue} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <RevisionForm
        currentResponse={initialValue}
        generationType="coverLetter"
        onRevision={onRevision}
      />
    </div>
  );
}

/**
 * Renders the Q&A view with revision capabilities.
 *
 * @param {{ qAndA: QAndAOutput, onRevision: (data: ReviseResponseData) => Promise<void> }} props - The component props.
 * @returns {JSX.Element} The rendered Q&A view.
 */
function QAndAView({
  qAndA,
  interviewPrep,
  isPrepping,
  onRegenPrep,
  onRevision,
  onQaGapFill,
}: {
  qAndA: QAndAOutput;
  interviewPrep?: InterviewPrepOutput;
  isPrepping?: boolean;
  onRegenPrep?: () => void;
  onRevision: (data: ReviseResponseData) => Promise<void>;
  onQaGapFill: (index: number, answer: string) => void;
}) {
  const formMethods = useFormContext<JobApplicationData>();
  const jobDescription = formMethods?.getValues('jobDescription') || '';

  if (!qAndA || !qAndA.qaPairs || qAndA.qaPairs.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No questions were found or provided to be answered.</p>
        </CardContent>
      </Card>
    );
  }

  const allAnswers = qAndA.qaPairs
    .map((p) => `Q: ${p.question}\nA: ${p.answer}`)
    .join('\n\n');
  const missingAnswersCount = qAndA.qaPairs.filter(
    (p) => p.answer === '[Answer not found in repository]'
  ).length;
  const NOT_FOUND_STRING = '[Answer not found in repository]';

  return (
    <div>
      <Tabs defaultValue="qa">
        <TabsList className="w-full mb-4 bg-muted/30">
          <TabsTrigger value="qa" className="flex-1 gap-2">
            <MessageSquareMore className="h-4 w-4" /> Q&amp;A Simulator
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex-1 gap-2">
            <GraduationCap className="h-4 w-4" /> Coaching Guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qa">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex flex-col">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareMore className="h-6 w-6 text-foreground" />
                  Q&amp;A
                </CardTitle>
                <CardDescription className="prose-sm dark:prose-invert">
                  Answers to questions found in the job description.
                </CardDescription>
              </div>
              <CopyButton textToCopy={allAnswers} />
            </CardHeader>
            <CardContent className="space-y-6">
              {missingAnswersCount > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Missing Information</AlertTitle>
                  <AlertDescription className="prose-sm dark:prose-invert">
                    {missingAnswersCount} question
                    {missingAnswersCount > 1 ? 's' : ''} could not be answered
                    based on your Work Repository. These are highlighted below.
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                {qAndA.qaPairs.map((pair, index) => (
                  <div
                    key={index}
                    className="relative rounded-md border bg-muted/50 p-4"
                  >
                    <p className="prose-sm dark:prose-invert pr-10 font-semibold text-primary dark:text-primary-foreground mb-2">
                      {pair.question}
                    </p>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {pair.answer === NOT_FOUND_STRING ? (
                        <div>
                            <span className="text-red-600 dark:text-red-400">{pair.answer}</span>
                            <MissingAnswerResolver 
                                question={pair.question} 
                                jobDescription={jobDescription} 
                                onResolve={(newAnswer) => onQaGapFill(index, newAnswer)} 
                            />
                        </div>
                      ) : (
                        <ReactMarkdown>{pair.answer}</ReactMarkdown>
                      )}
                    </div>
                    {pair.answer !== NOT_FOUND_STRING && (
                      <CopyButton
                        textToCopy={pair.answer}
                        className="absolute right-2 top-2"
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <RevisionForm
            currentResponse={JSON.stringify(qAndA, null, 2)}
            generationType="qAndA"
            onRevision={onRevision}
          />
        </TabsContent>

        <TabsContent value="coaching">
          {isPrepping ? (
            <div className="flex flex-col items-center justify-center py-8">
              <LoadingProgress className="p-0" interval={2000} />
            </div>
          ) : interviewPrep ? (
            <InterviewPrepView data={interviewPrep} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border-2 border-dashed border-muted-foreground/20">
              <GraduationCap className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Your personalised interview coaching guide will appear here once generated.
              </p>
              {onRegenPrep && (
                <Button size="sm" variant="outline" onClick={onRegenPrep}>
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Coaching Guide
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Renders the Deep Analysis view.
 *
 * @param {{ deepAnalysis: DeepAnalysisOutput }} props - The component props.
 * @returns {JSX.Element} The rendered deep analysis view.
 */
function DeepAnalysisView({
  deepAnalysis,
  onCoachRequest,
}: {
  deepAnalysis: DeepAnalysisOutput;
  onCoachRequest?: (message: string) => void;
}) {
  const formMethods = useFormContext<JobApplicationData>();
  const sortedRequirements = [...deepAnalysis.requirements].sort((a, b) =>
    a.isMandatory === b.isMandatory ? 0 : a.isMandatory ? -1 : 1
  );

  const mandatoryReqs = sortedRequirements.filter((r) => r.isMandatory);
  const preferredReqs = sortedRequirements.filter((r) => !r.isMandatory);

  const mandatoryMet = mandatoryReqs.filter((r) => r.isMet).length;
  const preferredMet = preferredReqs.filter((r) => r.isMet).length;

  const mandatoryMatchRate =
    mandatoryReqs.length > 0
      ? Math.round((mandatoryMet / mandatoryReqs.length) * 100)
      : 100;
  const preferredMatchRate =
    preferredReqs.length > 0
      ? Math.round((preferredMet / preferredReqs.length) * 100)
      : 100;
  const mandatoryGaps = mandatoryReqs.filter((r) => !r.isMet);
  const fitRead = mandatoryGaps.length > 0
    ? 'You have a possible fit, but some must-have signals are still weak or missing.'
    : preferredReqs.some((r) => !r.isMet)
      ? 'You meet the core requirements and can improve how strongly you show the optional ones.'
      : 'You look like a strong fit on paper. The next step is making that fit obvious in your application materials.';
  const biggestRisk = mandatoryGaps[0]?.requirement || 'No major must-have risk is showing in this analysis.';
  const recommendedNextMove = mandatoryGaps.length > 0
    ? 'Strengthen the Work Repository around the biggest missing must-have before polishing more documents.'
    : preferredReqs.some((r) => !r.isMet)
      ? 'Use your resume and cover letter to make the strongest preferred signals easier to spot.'
      : 'Move on to tailoring the resume and cover letter so the fit is visible in the first few seconds.';
  const requirementsByCategory = sortedRequirements.reduce<Record<string, typeof sortedRequirements>>((groups, requirement) => {
    const key = requirement.category || 'Other';
    groups[key] = groups[key] ? [...groups[key], requirement] : [requirement];
    return groups;
  }, {});
  const categoryEntries = Object.entries(requirementsByCategory);

  const renderImprovementAreas = (details?: string[]) => {
    if (!details || details.length === 0) {
      return null;
    }
    return (
      <ul className="prose prose-sm max-w-none dark:prose-invert list-disc space-y-2 pl-5">
        {details.map((item, index) => (
          <li key={index} className="ml-5">
            <ReactMarkdown components={{ p: Fragment }}>{item}</ReactMarkdown>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-foreground" />
            Fit Snapshot
          </CardTitle>
          <CardDescription className="prose-sm dark:prose-invert">
            A quick read on how promising this application looks and what to do next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-foreground">Coverage at a glance</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  These scores show how much of the role is already visible in your Work Repository.
                </p>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <CircularProgress
                      value={mandatoryMatchRate}
                      size={84}
                      strokeWidth={9}
                      trackClassName="text-primary/15"
                      indicatorClassName="text-primary"
                      valueClassName="text-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Must-have coverage</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Core requirements that look clearly supported right now.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-background p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <CircularProgress
                      value={preferredMatchRate}
                      size={84}
                      strokeWidth={9}
                      trackClassName="text-emerald-500/15"
                      indicatorClassName="text-emerald-500"
                      valueClassName="text-lg"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">Nice-to-have coverage</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Additional signals that can strengthen how competitive you appear.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What This Means
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{fitRead}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Biggest Risk
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{biggestRisk}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Best Next Move
                </p>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{recommendedNextMove}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Role Summary
            </p>
            <div className="prose prose-sm mt-3 max-w-none dark:prose-invert">
              <ReactMarkdown>{deepAnalysis.jobSummary}</ReactMarkdown>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-foreground" />
            <span>Requirement Analysis</span>
          </CardTitle>
          <CardDescription className="prose-sm dark:prose-invert">
            How your Work Repository aligns with the job&apos;s key requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion
            type="multiple"
            defaultValue={[]}
            className="w-full"
          >
            {categoryEntries.map(([category, items]) => {
              const metCount = items.filter((item) => item.isMet).length;
              const mandatoryGapCount = items.filter((item) => item.isMandatory && !item.isMet).length;

              return (
                <AccordionItem key={category} value={category} className="border-b-0">
                  <div className="rounded-2xl border bg-muted/30 px-4">
                    <AccordionTrigger className="py-4 hover:no-underline">
                      <div className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-base font-semibold text-foreground">{category}</p>
                          <p className="text-sm text-muted-foreground">
                            {metCount} of {items.length} requirements currently covered
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">{metCount}/{items.length} met</Badge>
                          {mandatoryGapCount > 0 ? (
                            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                              {mandatoryGapCount} mandatory gap{mandatoryGapCount > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                              No mandatory gaps
                            </Badge>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-3">
                        {items.map((item, index) => {
                          const coachPrompt = [
                            'Gap coaching request',
                            `Category: ${item.category}`,
                            `Requirement: ${item.requirement}`,
                            `Why it matters: ${item.justification}`,
                            'Coach me briefly on whether this is a real experience gap or mostly a framing gap, how to improve my Work Repository, and the best next application move.',
                          ].join('\n');

                          return (
                            <div
                              key={`${category}-${index}`}
                              className="rounded-2xl border bg-background p-4 shadow-sm"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant={item.isMandatory ? 'default' : 'secondary'}>
                                    {item.isMandatory ? 'Mandatory' : 'Preferred'}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={item.isMet
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                      : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'}
                                  >
                                    {item.isMet ? 'Covered' : 'Needs work'}
                                  </Badge>
                                </div>
                                {item.isMet ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-destructive" />
                                )}
                              </div>
                              <div className="mt-3 space-y-3">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Requirement
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
                                    {item.requirement}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Justification
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                                    {item.justification}
                                  </p>
                                </div>
                                {!item.isMet && item.isMandatory && onCoachRequest ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="w-full justify-center rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md shadow-primary/20 hover:opacity-95 sm:w-auto"
                                    onClick={() => onCoachRequest(coachPrompt)}
                                  >
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Get AI Coach Help On This Gap
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </div>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-foreground" />
            <span className="text-foreground">Improvement Areas</span>
          </CardTitle>
          <CardDescription className="prose-sm dark:prose-invert">
            Actionable advice to better present your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderImprovementAreas(deepAnalysis.improvementAreas)}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * A skeleton loader for the output view.
 * @returns {JSX.Element} The rendered skeleton.
 */
function SectionSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="mb-4 h-8 w-1/3" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="pt-4">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-full" />
      </div>
    </div>
  );
}

/**
 * The main component for displaying the output of AI generations.
 * It manages which view is active (cover letter, CV, etc.) and handles
 * the revision process.
 *
 * @param {OutputViewProps} props - The component props.
 * @returns {JSX.Element} The rendered output view.
 */
export function OutputView({
  activeView,
  setActiveView,
  allResults,
  setAllResults,
  isGenerating,
  generationError,
  onRetry,
  showSectionSwitcher = true,
  headerDescription,
  headerActions,
  onCoachRequest,
  isActiveViewStale = false,
}: OutputViewProps): JSX.Element {
  const { toast } = useToast();
  const formMethods = useFormContext<JobApplicationData>();
  const [isPrepping, setIsPrepping] = useState(false);

  /**
   * Handles the logic for revising content.
   * @param {ReviseResponseData} data - The data for the revision request.
   */
  const handleRevision = async (data: ReviseResponseData) => {
    const { generationType } = data;
    const result = await reviseAction(data);
    
    if ('error' in result) {
        toast({
            variant: 'destructive',
            title: 'Revision Failed',
            description: result.error,
        });
    } else {
        setAllResults((prev) => ({
            ...prev,
            [generationType]: result,
        }));
    }
  };

  /**
   * Handles manual edits to the cover letter.
   * @param {string} newValue - The new text for the cover letter.
   */
  const handleManualEdit = (newValue: string) => {
    setAllResults((prev: AllGenerationResults) => {
      if (!prev.coverLetter) return prev;
      const newResult = { ...prev.coverLetter, responses: newValue };
      return { ...prev, coverLetter: newResult };
    });
  };

  const handleCvUpdate = (newCvData: CvOutput) => {
    setAllResults((prev: AllGenerationResults) => ({ ...prev, cv: newCvData }));
  };

  const handleQaGapFill = (index: number, newAnswer: string) => {
    setAllResults((prev: AllGenerationResults) => {
      if (!prev.qAndA) return prev;
      const newQaPairs = [...prev.qAndA.qaPairs];
      newQaPairs[index] = { ...newQaPairs[index], answer: newAnswer };
      return { ...prev, qAndA: { ...prev.qAndA, qaPairs: newQaPairs } };
    });
  };

  const handleRegenPrep = async () => {
    const jd = formMethods?.getValues('jobDescription') || '';
    const wr = formMethods?.getValues('workRepository') || '';
    if (!jd || !wr) return;
    setIsPrepping(true);
    const result = await generateInterviewPrepAction({ jobDescription: jd, workRepository: wr });
    setIsPrepping(false);
    if ('error' in result) {
      toast({ variant: 'destructive', title: 'Interview Prep Failed', description: result.error });
    } else {
      setAllResults((prev) => ({ ...prev, interviewPrep: result }));
    }
  };

  const renderActiveView = () => {
    if (generationError) {
        return <ErrorDisplay errorMessage={generationError} onRetry={onRetry} />;
    }
    
    if (isGenerating && !allResults[activeView as GenerationType]) {
      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center">
            <LoadingProgress />
        </div>
      );
    }
    
    switch (activeView) {
      case 'coverLetter':
        if (!allResults.coverLetter) return null;
        return (
          <GeneratedResponseView
            initialValue={allResults.coverLetter.responses}
            onValueChange={handleManualEdit}
            onRevision={handleRevision}
          />
        );
      case 'cv':
        if (!allResults.cv) return null;
        return (
          <CvView
            cvData={allResults.cv}
            deepAnalysis={allResults.deepAnalysis}
            jobDescription={formMethods?.getValues('jobDescription') || ''}
            onCvUpdate={handleCvUpdate}
          />
        );
      case 'deepAnalysis':
        if (!allResults.deepAnalysis) return null;
        return <DeepAnalysisView deepAnalysis={allResults.deepAnalysis} onCoachRequest={onCoachRequest} />;
      case 'qAndA':
        if (!allResults.qAndA) return null;
        return (
          <QAndAView
            qAndA={allResults.qAndA as QAndAOutput}
            interviewPrep={allResults.interviewPrep}
            isPrepping={isPrepping}
            onRegenPrep={handleRegenPrep}
            onRevision={handleRevision}
            onQaGapFill={handleQaGapFill}
          />
        );
      default:
        return (
          <Card className="flex min-h-[400px] items-center justify-center">
            <CardContent className="p-4 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Your generated content will appear here.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {activeView !== 'none' ? (
              <CardTitle className="flex items-center gap-2">
                {VIEW_CONFIG[activeView as GenerationType].icon}{' '}
                {VIEW_CONFIG[activeView as GenerationType].title}
              </CardTitle>
            ) : (
              <CardTitle>Output</CardTitle>
            )}
            {headerDescription ? (
              <CardDescription className="mt-2 text-sm">
                {headerDescription}
              </CardDescription>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            {showSectionSwitcher ? (
              <div className="flex items-center gap-1">
                {(Object.keys(allResults) as (keyof AllGenerationResults)[])
                  .filter((key): key is GenerationType => key !== 'interviewPrep' && !!allResults[key] && !!VIEW_CONFIG[key as GenerationType])
                  .map((key) => (
                    <Button
                      key={key}
                      variant={activeView === key ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setActiveView(key)}
                      aria-label={`View ${VIEW_CONFIG[key].title}`}
                      disabled={isGenerating && !allResults[key]}
                    >
                      {VIEW_CONFIG[key].icon}
                    </Button>
                  ))
                }
              </div>
            ) : null}
          </div>
        </div>
        {isActiveViewStale ? (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            <AlertTitle>Inputs changed after this was generated</AlertTitle>
            <AlertDescription>
              This section reflects an older version of your job description, Work Repository, or questions. Refresh it to match the latest inputs.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardHeader>
      <CardContent>{renderActiveView()}</CardContent>
    </Card>
  );
}
