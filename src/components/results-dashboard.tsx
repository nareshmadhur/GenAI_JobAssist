
'use client';

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  Copy, 
  Download, 
  Trophy, 
  Target, 
  Lightbulb, 
  Briefcase, 
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import { type AllGenerationResults } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { openCvPrintExport } from '@/lib/cv-export';

interface ResultsDashboardProps {
  results: AllGenerationResults;
  jobTitle: string;
  companyName: string;
  onBack: () => void;
  backLabel?: string;
}

export function ResultsDashboard({ results, jobTitle, companyName, onBack, backLabel = 'Back to Build Your Application' }: ResultsDashboardProps) {
  const { toast } = useToast();
  const analysis = results.deepAnalysis;
  const matchScore = analysis?.matchScore ?? 0;

  const scoreColor = 
    matchScore >= 80 ? 'text-emerald-500' : 
    matchScore >= 50 ? 'text-amber-500' : 
    'text-rose-500';

  const scoreBg = 
    matchScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : 
    matchScore >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 
    'bg-rose-500/10 border-rose-500/20';

  const handleCopy = async (text: string, successMessage: string) => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: successMessage });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Could not copy the generated content.',
      });
    }
  };

  const handleExportCv = () => {
    if (!results.cv) return;

    try {
      openCvPrintExport(results.cv);
    } catch {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Could not prepare the CV for export.',
      });
    }
  };

  const cvPlainText = results.cv
    ? [
        results.cv.fullName,
        [results.cv.email, results.cv.phone, results.cv.location].filter(Boolean).join(' | '),
        '',
        'Professional Summary',
        results.cv.summary,
        '',
        'Experience',
        ...results.cv.workExperience.flatMap((exp) => [
          `${exp.jobTitle} @ ${exp.company} (${exp.duration})`,
          ...exp.responsibilities.map((item) => `- ${item}`),
          '',
        ]),
        'Education',
        ...results.cv.education.map((edu) => `${edu.degree} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`),
        '',
        'Skills',
        results.cv.skills.join(', '),
      ].join('\n')
    : '';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header / Hero */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-card border shadow-sm">
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" /> {backLabel}
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{jobTitle}</h1>
          <p className="text-lg text-muted-foreground flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> {companyName}
          </p>
        </div>

        <div className={cn("flex items-center gap-4 px-6 py-4 rounded-2xl border", scoreBg)}>
          <div className="flex flex-col items-center">
            <span className={cn("text-4xl font-black", scoreColor)}>{matchScore}%</span>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Match Score</span>
          </div>
          <div className="h-10 w-px bg-current opacity-20 hidden sm:block" />
          <div className="hidden sm:flex flex-col gap-1">
             <div className="flex items-center gap-2">
                <Trophy className={cn("h-4 w-4", scoreColor)} />
                <span className="text-sm font-semibold">
                    {matchScore >= 80 ? 'Strong Candidate' : matchScore >= 50 ? 'Good Potential' : 'Focus on Bridging Gaps'}
                </span>
             </div>
             <Progress value={matchScore} className="h-1.5 w-32" />
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-fit h-12 p-1 bg-muted/50 rounded-xl mb-6">
          <TabsTrigger value="insights" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Target className="mr-2 h-4 w-4" /> Analysis
          </TabsTrigger>
          <TabsTrigger value="coaching" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Lightbulb className="mr-2 h-4 w-4" /> Coaching
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText className="mr-2 h-4 w-4" /> Documents
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Job Summary */}
              <Card className="rounded-2xl overflow-hidden border-none shadow-sm bg-muted/30">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" /> Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                    {analysis?.jobSummary || ''}
                  </ReactMarkdown>
                </CardContent>
              </Card>

              {/* Requirements Checklist */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" /> Core Requirements Analysis
                  </CardTitle>
                  <CardDescription>How your experience aligns with the job&apos;s expectations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {analysis?.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors border-b last:border-0 border-muted-foreground/5">
                        <div className="mt-1">
                          {req.isMet ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : req.isMandatory ? (
                            <XCircle className="h-5 w-5 text-rose-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{req.requirement}</span>
                            {req.isMandatory && (
                              <Badge variant="destructive" className="text-[9px] h-4 py-0 font-bold uppercase tracking-tighter">Mandatory</Badge>
                            )}
                            <Badge variant="outline" className="text-[9px] h-4 py-0 text-muted-foreground">{req.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed italic">
                            {req.justification}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
               {/* Improvement Areas */}
               <Card className="rounded-2xl bg-primary/5 border-primary/10 shadow-sm overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" /> Optimization Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {analysis?.improvementAreas.map((area, idx) => (
                    <div key={idx} className="flex gap-3 text-sm leading-relaxed">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <ReactMarkdown className="prose-xs prose-p:my-0 dark:prose-invert">
                        {area}
                      </ReactMarkdown>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Coaching Tab */}
        <TabsContent value="coaching" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="rounded-2xl shadow-sm overflow-hidden border-none bg-card">
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
              <div className="md:col-span-1 bg-muted/30 p-8 border-r">
                <div className="sticky top-8 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">Strategy Guide</h3>
                  <p className="text-sm text-muted-foreground">Tailored advice to navigate the hiring process for this specific role.</p>
                </div>
              </div>
              <div className="md:col-span-3 p-8">
                <ScrollArea className="h-[600px] pr-6">
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    <ReactMarkdown>
                      {analysis?.coachingGuide || "No coaching guide generated. Try running the analysis again."}
                    </ReactMarkdown>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="focus-visible:outline-none focus-visible:ring-0">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CV Preview */}
              <Card className="rounded-2xl overflow-hidden border shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
                    <CardTitle className="text-md flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Optimized CV
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(cvPlainText, 'CV copied to clipboard')}
                          disabled={!results.cv}
                          aria-label="Copy CV"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleExportCv}
                          disabled={!results.cv}
                          aria-label="Download CV"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-muted/10 relative h-[500px]">
                   <ScrollArea className="h-full p-8">
                      <div className="bg-background shadow-lg mx-auto max-w-[500px] p-10 min-h-[700px] rounded-sm transform scale-[0.9] origin-top transition-transform group-hover:scale-[0.95] duration-500">
                         {/* CV Mock Content - This should ideally reuse the CVView component */}
                         <div className="space-y-6 text-[10px] text-foreground">
                            <div className="text-center space-y-1">
                                <h1 className="text-lg font-bold border-b pb-1 mb-2 tracking-tight uppercase">{results.cv?.fullName || 'Your Name'}</h1>
                                <p className="text-muted-foreground">{results.cv?.email} | {results.cv?.location}</p>
                            </div>
                            <div className="space-y-2">
                                <h2 className="font-bold border-b text-[12px] uppercase tracking-wider">Professional Summary</h2>
                                <p className="leading-relaxed">{results.cv?.summary}</p>
                            </div>
                            <div className="space-y-4">
                                <h2 className="font-bold border-b text-[12px] uppercase tracking-wider">Experience</h2>
                                {results.cv?.workExperience.map((exp, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between font-bold">
                                            <span>{exp.jobTitle} @ {exp.company}</span>
                                            <span>{exp.duration}</span>
                                        </div>
                                        <ul className="list-disc pl-4 space-y-0.5">
                                            {exp.responsibilities.map((res, j) => <li key={j}>{res}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                         </div>
                      </div>
                   </ScrollArea>
                   <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </CardContent>
              </Card>

              {/* Cover Letter Preview */}
              <Card className="rounded-2xl overflow-hidden border shadow-sm group">
                <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/30 py-4">
                    <CardTitle className="text-md flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Tailored Cover Letter
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(results.coverLetter?.responses || '', 'Cover letter copied to clipboard')}
                          disabled={!results.coverLetter?.responses}
                          aria-label="Copy cover letter"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 bg-muted/10 h-[500px]">
                   <ScrollArea className="h-full p-8">
                        <div className="bg-background shadow-lg mx-auto max-w-[500px] p-10 min-h-[700px] rounded-sm transform scale-[0.9] origin-top transition-transform group-hover:scale-[0.95] duration-500">
                             <div className="prose prose-xs dark:prose-invert">
                                <ReactMarkdown>{results.coverLetter?.responses || results.coverLetter?.toString() || ''}</ReactMarkdown>
                             </div>
                        </div>
                   </ScrollArea>
                   <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
