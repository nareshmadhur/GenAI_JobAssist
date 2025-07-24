
'use client';

import {
  Briefcase,
  Check,
  CheckCircle2,
  Copy,
  Edit,
  FileText,
  Lightbulb,
  MessageSquareMore,
  Save,
  Sparkles,
  Wand2,
  XCircle,
} from 'lucide-react';
import React, { Fragment, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { compiler } from 'markdown-to-jsx';
import ReactDOMServer from 'react-dom/server';

import type { DeepAnalysisOutput } from '@/ai/flows';
import type { CvOutput } from '@/ai/flows/generate-cv';
import { reviseAction } from '@/app/actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { QAndAOutput, ReviseResponseData } from '@/lib/schemas';
import type { AllGenerationResults, GenerationType } from './job-spark-app';
import { Button } from './ui/button';
import { CvView } from './cv-view';
import type { ActiveView } from './job-spark-app';
import { RevisionForm } from './revision-form';
import { Textarea } from './ui/textarea';
import { ErrorDisplay } from './error-display';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';

interface OutputViewProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  allResults: AllGenerationResults;
  setAllResults: React.Dispatch<React.SetStateAction<AllGenerationResults>>;
  isGenerating: boolean;
  generationError: string | null;
}

const VIEW_CONFIG: Record<GenerationType, { title: string; icon: React.ReactNode }> = {
  coverLetter: { title: 'Cover Letter', icon: <FileText className="h-5 w-5" /> },
  cv: { title: 'Curriculum Vitae (CV)', icon: <Briefcase className="h-5 w-5" /> },
  deepAnalysis: { title: 'Deep Analysis', icon: <Lightbulb className="h-5 w-5" /> },
  qAndA: { title: 'Q & A', icon: <MessageSquareMore className="h-5 w-5" /> },
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
      console.error('Failed to copy rich text, falling back to plain text:', err);
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
        <div className="prose prose-sm relative min-h-[150px] max-w-none rounded-md border bg-background p-4">
          <Markdown>{localValue}</Markdown>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
            className="absolute right-0 top-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
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
  onRevision,
}: {
  qAndA: QAndAOutput;
  onRevision: (data: ReviseResponseData) => Promise<void>;
}) {
  if (!qAndA || !qAndA.qaPairs || qAndA.qaPairs.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <p>No questions were provided to be answered.</p>
        </CardContent>
      </Card>
    );
  }

  const allAnswers = qAndA.qaPairs
    .map((p) => `Q: ${p.question}\nA: ${p.answer}`)
    .join('\n\n');
  const missingAnswersCount = qAndA.qaPairs.filter(
    (p) => p.answer === '[Answer not found in bio]'
  ).length;
  const NOT_FOUND_STRING = '[Answer not found in bio]';

  return (
    <div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <CardTitle className="flex items-center gap-2">
              <MessageSquareMore className="h-6 w-6 text-primary" />
              Q&A
            </CardTitle>
            <CardDescription className="prose-sm">
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
              <AlertDescription className="prose-sm">
                {missingAnswersCount} question
                {missingAnswersCount > 1 ? 's' : ''} could not be answered
                based on your bio. These are highlighted below.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {qAndA.qaPairs.map((pair, index) => (
              <div
                key={index}
                className="relative rounded-md border bg-muted/50 p-4"
              >
                <p className="prose-sm pr-10 font-semibold text-primary mb-2">
                  {pair.question}
                </p>
                <div className="prose prose-sm max-w-none">
                  {pair.answer === NOT_FOUND_STRING ? (
                    <span className="text-destructive">{pair.answer}</span>
                  ) : (
                    <Markdown>{pair.answer}</Markdown>
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
    </div>
  );
}

/**
 * Renders the Deep Analysis view.
 *
 * @param {{ deepAnalysis: DeepAnalysisOutput, onRevision: (data: ReviseResponseData) => Promise<void> }} props - The component props.
 * @returns {JSX.Element} The rendered deep analysis view.
 */
function DeepAnalysisView({
  deepAnalysis,
  onRevision,
}: {
  deepAnalysis: DeepAnalysisOutput;
  onRevision: (data: ReviseResponseData) => Promise<void>;
}) {
  const renderRequirements = (items: typeof deepAnalysis.mustHaves) => {
    if (!items || items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          No specific requirements were identified in this category.
        </p>
      );
    }
    return (
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            {item.isMet ? (
              <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
            ) : (
              <XCircle className="mt-1 h-5 w-5 flex-shrink-0 text-red-500" />
            )}
            <span className="text-sm">{item.requirement}</span>
          </li>
        ))}
      </ul>
    );
  };

  const renderImprovementAreas = (details?: string[]) => {
    if (!details || details.length === 0) {
      return null;
    }
    return (
      <ul className="prose prose-sm max-w-none list-disc space-y-2 pl-5">
        {details.map((item, index) => (
          <li key={index} className="ml-5">
            <Markdown components={{ p: Fragment }}>{item}</Markdown>
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
            <Briefcase className="h-6 w-6 text-primary" />
            Job Summary
          </CardTitle>
          <CardDescription className="prose-sm">
            An expert summary of the role's core requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <Markdown>{deepAnalysis.jobSummary}</Markdown>
          </div>
        </CardContent>
      </Card>

      {deepAnalysis.qAndA && (
        <QAndAView qAndA={deepAnalysis.qAndA} onRevision={onRevision} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <span>Must-Have Requirements</span>
          </CardTitle>
          <CardDescription className="prose-sm">
            Essential criteria for the role and your alignment.
          </CardDescription>
        </CardHeader>
        <CardContent>{renderRequirements(deepAnalysis.mustHaves)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <span>Preferred Qualifications</span>
          </CardTitle>
          <CardDescription className="prose-sm">
            "Nice-to-have" skills and your alignment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderRequirements(deepAnalysis.preferred)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-yellow-500" />
            <span className="text-yellow-600">Improvement Areas</span>
          </CardTitle>
          <CardDescription className="prose-sm">
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
}: OutputViewProps): JSX.Element {
  const { toast } = useToast();

  /**
   * Handles the logic for revising content.
   * @param {ReviseResponseData} data - The data for the revision request.
   */
  const handleRevision = async (data: ReviseResponseData) => {
    const { generationType } = data;

    const result = await reviseAction(data);

    if (result.success) {
      setAllResults((prev) => ({ ...prev, [generationType]: result.data as any }));
    } else {
      toast({
        variant: 'destructive',
        title: 'Revision Failed',
        description: result.error,
      });
    }
  };

  /**
   * Handles manual edits to the cover letter.
   * @param {string} newValue - The new text for the cover letter.
   */
  const handleManualEdit = (newValue: string) => {
    setAllResults((prev) => {
      if (!prev.coverLetter) return prev;
      const newResult = { ...prev.coverLetter, responses: newValue };
      return { ...prev, coverLetter: newResult };
    });
  };

  const renderActiveView = () => {
    if (isGenerating && !allResults[activeView as GenerationType]) {
      return <SectionSkeleton />;
    }
    if (generationError && !allResults[activeView as GenerationType]) {
      return (
        <Card>
          <CardContent className="p-4">
            <ErrorDisplay error={generationError} />
          </CardContent>
        </Card>
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
        return <CvView cvData={allResults.cv as CvOutput} />;
      case 'deepAnalysis':
        if (!allResults.deepAnalysis) return null;
        return (
          <DeepAnalysisView
            deepAnalysis={allResults.deepAnalysis}
            onRevision={handleRevision}
          />
        );
      case 'qAndA':
        if (!allResults.qAndA) return null;
        return (
          <QAndAView
            qAndA={allResults.qAndA as QAndAOutput}
            onRevision={handleRevision}
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
      <CardHeader>
        <div className="flex items-center justify-between">
          {activeView !== 'none' ? (
            <CardTitle className="flex items-center gap-2">
              {VIEW_CONFIG[activeView as GenerationType].icon}{' '}
              {VIEW_CONFIG[activeView as GenerationType].title}
            </CardTitle>
          ) : (
            <CardTitle>Output</CardTitle>
          )}
          <div className="flex items-center gap-1">
            {(Object.keys(allResults) as GenerationType[]).map(
              (key) =>
                allResults[key] && (
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
                )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderActiveView()}</CardContent>
    </Card>
  );
}
