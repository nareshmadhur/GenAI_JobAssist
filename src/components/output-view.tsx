

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
import ReactMarkdown from 'react-markdown';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from './ui/badge';
import { CircularProgress } from './circular-progress';
import { EditRequest } from '@/app/page';

interface OutputViewProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  allResults: AllGenerationResults;
  setAllResults: React.Dispatch<React.SetStateAction<AllGenerationResults>>;
  isGenerating: boolean;
  generationError: string | null;
  onEditRequest: (request: EditRequest) => void;
}

const VIEW_CONFIG: Record<
  GenerationType,
  { title: string; icon: React.ReactNode }
> = {
  coverLetter: { title: 'Cover Letter', icon: <FileText className="h-5 w-5" /> },
  cv: { title: 'Curriculum Vitae (CV)', icon: <Briefcase className="h-5 w-5" /> },
  deepAnalysis: {
    title: 'Deep Analysis',
    icon: <Lightbulb className="h-5 w-5" />,
  },
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
              <MessageSquareMore className="h-6 w-6 text-foreground" />
              Q&A
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
                <p className="prose-sm dark:prose-invert pr-10 font-semibold text-primary dark:text-primary-foreground mb-2">
                  {pair.question}
                </p>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {pair.answer === NOT_FOUND_STRING ? (
                    <span className="text-red-600 dark:text-red-400">{pair.answer}</span>
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
}: {
  deepAnalysis: DeepAnalysisOutput;
}) {
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
            Job Summary
          </CardTitle>
          <CardDescription className="prose-sm dark:prose-invert">
            An expert summary of the role's core requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{deepAnalysis.jobSummary}</ReactMarkdown>
          </div>
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-4 text-center text-sm font-semibold text-muted-foreground">
              Match Rate
            </h4>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={mandatoryMatchRate} />
                <p className="font-semibold">Mandatory</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CircularProgress value={preferredMatchRate} />
                <p className="font-semibold">Preferred</p>
              </div>
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
            How your bio aligns with the job's key requirements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-2 px-4">Status</TableHead>
                <TableHead className="py-2 px-4">Category</TableHead>
                <TableHead className="py-2 px-4">Requirement</TableHead>
                <TableHead className="py-2 px-4 text-center">Met</TableHead>
                <TableHead className="py-2 px-4 w-[40%]">Justification</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRequirements.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="py-2 px-4">
                    <Badge
                      variant={item.isMandatory ? 'default' : 'secondary'}
                    >
                      {item.isMandatory ? 'Mandatory' : 'Preferred'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-4">{item.category}</TableCell>
                  <TableCell className="py-2 px-4">{item.requirement}</TableCell>
                  <TableCell className="py-2 px-4 text-center">
                    {item.isMet ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400 inline-block" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive inline-block" />
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-4 text-sm">
                    {item.justification}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
  onEditRequest,
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
      setAllResults((prev) => ({
        ...prev,
        [generationType]: result.data as any,
      }));
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
        return <CvView cvData={allResults.cv as CvOutput} onEditRequest={onEditRequest} />;
      case 'deepAnalysis':
        if (!allResults.deepAnalysis) return null;
        return <DeepAnalysisView deepAnalysis={allResults.deepAnalysis} />;
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
